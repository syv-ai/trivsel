"""
System routes for scheduled tasks and administration.

These routes are typically called by cron jobs or system administrators.
Only superusers and admins can access these routes.
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.core.config import settings
from app.models import (
    Message,
    SessionStatus,
    StaffRole,
    StudentStatus,
)
from app.services import alerts
from app.services.email import email_service

router = APIRouter(prefix="/system", tags=["system"])


def check_system_access(current_user: CurrentUser) -> None:
    """Verify user has system/admin access."""
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access system functions",
        )


@router.post("/send-surveys", response_model=Message)
async def send_weekly_surveys(
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """
    Send weekly survey emails to all eligible students.

    This should be triggered weekly (e.g., every Wednesday).
    Creates survey sessions for all active students with consent.
    """
    check_system_access(current_user)

    # Get current week/year
    now = datetime.utcnow()
    week_number = now.isocalendar()[1]
    year = now.year

    # Get all active students with consent
    students, _ = crud.get_students(
        session=session,
        status=StudentStatus.ACTIVE,
        limit=1000,  # Reasonable limit for pilot
    )

    sent_count = 0
    error_count = 0

    for student in students:
        # Skip students without consent
        if not student.consent_status:
            continue

        # Check if a session already exists for this week
        existing_sessions = crud.get_student_sessions(
            session=session,
            student_id=student.id,
            limit=1,
        )
        if existing_sessions:
            latest = existing_sessions[0]
            if latest.week_number == week_number and latest.year == year:
                # Already has a session for this week
                continue

        try:
            # Create survey session
            survey_session = crud.create_survey_session(
                session=session,
                student_id=student.id,
                week_number=week_number,
                year=year,
                token_expiry_days=settings.SURVEY_TOKEN_EXPIRY_DAYS,
            )

            # Send email
            await email_service.send_survey_invitation(
                student_email=student.email,
                student_name=student.name,
                token=survey_session.token,
                week_number=week_number,
            )

            sent_count += 1

        except Exception as e:
            error_count += 1
            # Log error but continue with other students
            print(f"Error sending survey to {student.email}: {e}")

    return Message(
        message=f"Surveys sent: {sent_count} successful, {error_count} errors"
    )


@router.post("/send-reminders", response_model=Message)
async def send_reminders(
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """
    Send reminders for incomplete surveys.

    This should be triggered 1-2 times during the survey window.
    Only sends reminders to pending surveys that haven't exceeded max reminders.
    """
    check_system_access(current_user)

    # Get pending sessions
    pending_sessions = crud.get_pending_sessions(session=session)

    sent_count = 0
    error_count = 0

    for survey_session in pending_sessions:
        # Check if max reminders reached
        if survey_session.reminder_count >= settings.SURVEY_MAX_REMINDERS:
            continue

        # Get student
        student = crud.get_student(session=session, student_id=survey_session.student_id)
        if not student or not student.consent_status:
            continue

        try:
            # Send reminder
            await email_service.send_survey_reminder(
                student_email=student.email,
                student_name=student.name,
                token=survey_session.token,
                week_number=survey_session.week_number,
                reminder_number=survey_session.reminder_count + 1,
            )

            # Increment reminder count
            crud.increment_reminder_count(session=session, db_session=survey_session)

            sent_count += 1

        except Exception as e:
            error_count += 1
            print(f"Error sending reminder to {student.email}: {e}")

    return Message(
        message=f"Reminders sent: {sent_count} successful, {error_count} errors"
    )


@router.post("/process-expired", response_model=Message)
async def process_expired_sessions(
    session: SessionDep,
    current_user: CurrentUser,
) -> Message:
    """
    Process expired survey sessions.

    This should be triggered daily after the survey window closes.
    Marks expired sessions as non-response and creates alerts for mentors.
    """
    check_system_access(current_user)

    processed_count = await alerts.process_expired_sessions(db_session=session)

    return Message(message=f"Processed {processed_count} expired sessions")


@router.get("/health")
def health_check() -> dict:
    """
    Simple health check endpoint.

    Can be used by monitoring systems to verify the API is running.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/stats")
def get_system_stats(
    session: SessionDep,
    current_user: CurrentUser,
) -> dict:
    """
    Get system statistics for monitoring.
    """
    check_system_access(current_user)

    from app.models import Student, SurveySession, Score

    from sqlmodel import select, func

    # Count active students
    active_students = session.exec(
        select(func.count(Student.id)).where(
            Student.status == StudentStatus.ACTIVE,
            Student.consent_status == True,
        )
    ).one()

    # Count total students
    total_students = session.exec(select(func.count(Student.id))).one()

    # Count pending sessions
    pending_sessions = session.exec(
        select(func.count(SurveySession.id)).where(
            SurveySession.status == SessionStatus.PENDING
        )
    ).one()

    # Count completed sessions (this week)
    now = datetime.utcnow()
    week_number = now.isocalendar()[1]
    year = now.year

    completed_this_week = session.exec(
        select(func.count(SurveySession.id)).where(
            SurveySession.status == SessionStatus.COMPLETED,
            SurveySession.week_number == week_number,
            SurveySession.year == year,
        )
    ).one()

    return {
        "active_students": active_students,
        "total_students": total_students,
        "pending_sessions": pending_sessions,
        "completed_this_week": completed_this_week,
        "current_week": week_number,
        "current_year": year,
    }
