"""
Dashboard routes for mentors and team members.

Provides overview of student wellbeing status and alerts.
"""

import uuid

from fastapi import APIRouter, Query

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    AlertInfo,
    AlertsResponse,
    DashboardOverview,
    NotificationPublic,
    NotificationsPublic,
    ScoreColor,
    StaffRole,
    StudentWithLatestScore,
)
from app.services.alerts import get_alert_summary_for_mentor

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(
    session: SessionDep,
    current_user: CurrentUser,
) -> DashboardOverview:
    """
    Get dashboard overview with student status summary.

    Returns list of students with their latest scores and color-coded status.
    """
    # Determine if user sees all students or only assigned ones
    user_id = None
    if not current_user.is_superuser and current_user.role not in [StaffRole.ADMIN, StaffRole.ANALYST]:
        user_id = current_user.id

    students_with_scores = crud.get_students_with_latest_scores(
        session=session,
        user_id=user_id,
    )

    # Build response with counts
    green_count = 0
    yellow_count = 0
    red_count = 0
    non_response_count = 0

    students_data = []
    for student, score in students_with_scores:
        student_data = StudentWithLatestScore(
            id=student.id,
            internal_id=student.internal_id,
            name=student.name,
            email=student.email,
            phase=student.phase,
            consent_status=student.consent_status,
            status=student.status,
            consent_date=student.consent_date,
            created_at=student.created_at,
            latest_score=score.score_value if score else None,
            latest_color=score.color if score else None,
            last_response_date=score.calculated_at if score else None,
        )
        students_data.append(student_data)

        if score:
            if score.color == ScoreColor.GREEN:
                green_count += 1
            elif score.color == ScoreColor.YELLOW:
                yellow_count += 1
            elif score.color == ScoreColor.RED:
                red_count += 1
        else:
            non_response_count += 1

    return DashboardOverview(
        total_students=len(students_data),
        green_count=green_count,
        yellow_count=yellow_count,
        red_count=red_count,
        non_response_count=non_response_count,
        students=students_data,
    )


@router.get("/alerts", response_model=AlertsResponse)
def get_alerts(
    session: SessionDep,
    current_user: CurrentUser,
    unread_only: bool = Query(default=True),
    skip: int = 0,
    limit: int = 50,
) -> AlertsResponse:
    """
    Get alerts/notifications for the current user.
    """
    notifications, count = crud.get_user_notifications(
        session=session,
        user_id=current_user.id,
        unread_only=unread_only,
        skip=skip,
        limit=limit,
    )

    alerts_data = []
    for notification in notifications:
        # Get student name if notification is about a student
        student_name = "Unknown"
        if notification.student_id:
            student = crud.get_student(session=session, student_id=notification.student_id)
            if student:
                student_name = student.name

        alert = AlertInfo(
            id=notification.id,
            student_id=notification.student_id,
            student_name=student_name,
            type=notification.type,
            title=notification.title,
            message=notification.message,
            sent_at=notification.sent_at,
            read_at=notification.read_at,
        )
        alerts_data.append(alert)

    return AlertsResponse(data=alerts_data, count=count)


@router.get("/alerts/summary")
def get_alert_summary(
    session: SessionDep,
    current_user: CurrentUser,
) -> dict:
    """
    Get summary of unread alerts by type.
    """
    return get_alert_summary_for_mentor(
        db_session=session,
        user_id=current_user.id,
    )


@router.post("/alerts/{notification_id}/read")
def mark_alert_read(
    session: SessionDep,
    current_user: CurrentUser,
    notification_id: uuid.UUID,
) -> dict:
    """
    Mark a notification as read.
    """
    notification = crud.get_notification(session=session, notification_id=notification_id)

    if not notification:
        return {"message": "Notification not found"}

    # Verify the notification belongs to the current user
    if notification.user_id != current_user.id:
        return {"message": "Not authorized"}

    crud.mark_notification_read(session=session, db_notification=notification)
    return {"message": "Notification marked as read"}


@router.get("/high-risk", response_model=list[StudentWithLatestScore])
def get_high_risk_students(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[StudentWithLatestScore]:
    """
    Get students with critical (red) status.
    """
    # Determine if user sees all students or only assigned ones
    user_id = None
    if not current_user.is_superuser and current_user.role not in [StaffRole.ADMIN, StaffRole.ANALYST]:
        user_id = current_user.id

    high_risk = crud.get_high_risk_students(
        session=session,
        user_id=user_id,
    )

    students_data = []
    for student, score in high_risk:
        student_data = StudentWithLatestScore(
            id=student.id,
            internal_id=student.internal_id,
            name=student.name,
            email=student.email,
            phase=student.phase,
            consent_status=student.consent_status,
            status=student.status,
            consent_date=student.consent_date,
            created_at=student.created_at,
            latest_score=score.score_value,
            latest_color=score.color,
            last_response_date=score.calculated_at,
        )
        students_data.append(student_data)

    return students_data
