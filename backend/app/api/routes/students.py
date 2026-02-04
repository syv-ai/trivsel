"""
Student management routes.

These routes require authentication. Access is controlled based on user role:
- Admin: Full CRUD access to all students
- Mentor/FACT: Read access to assigned students only, plus intervention logging
- Analyst: Read-only access to anonymized data (handled in analytics routes)
"""

import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.services.email import email_service

logger = logging.getLogger(__name__)
from app.models import (
    InterventionCreate,
    InterventionPublic,
    InterventionsPublic,
    Message,
    ScoreHistory,
    ScorePublic,
    ScoresPublic,
    SendSurveyRequest,
    StaffRole,
    Student,
    StudentCreate,
    StudentPublic,
    StudentsPublic,
    StudentUpdate,
    StudentStatus,
)

router = APIRouter(prefix="/students", tags=["students"])


def check_student_access(
    current_user: CurrentUser,
    student: Student,
    session: SessionDep,
) -> None:
    """Check if the current user has access to view/modify a student."""
    # Superusers and admins have full access
    if current_user.is_superuser or current_user.role == StaffRole.ADMIN:
        return

    # Other users need to be assigned to the student
    if not crud.is_user_assigned_to_student(
        session=session,
        user_id=current_user.id,
        student_id=student.id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this student",
        )


@router.get("/", response_model=StudentsPublic)
def get_students(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
    status_filter: StudentStatus | None = None,
) -> StudentsPublic:
    """
    Get list of students.

    - Admin/Superuser: Returns all students
    - Mentor/FACT: Returns only assigned students
    """
    if current_user.is_superuser or current_user.role == StaffRole.ADMIN:
        students, count = crud.get_students(
            session=session,
            skip=skip,
            limit=limit,
            status=status_filter,
        )
    else:
        students, count = crud.get_students_by_mentor(
            session=session,
            user_id=current_user.id,
            skip=skip,
            limit=limit,
        )

    return StudentsPublic(
        data=[StudentPublic.model_validate(s) for s in students],
        count=count,
    )


@router.post("/", response_model=StudentPublic)
async def create_student(
    session: SessionDep,
    current_user: CurrentUser,
    student_in: StudentCreate,
    background_tasks: BackgroundTasks,
) -> StudentPublic:
    """
    Create a new student.

    Only admins and superusers can create students.
    A consent request email will be sent to the student.
    """
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create students",
        )

    # Check if email already exists
    existing = crud.get_student_by_email(session=session, email=student_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A student with this email already exists",
        )

    student = crud.create_student(session=session, student_in=student_in)

    # Send consent request email in background
    async def send_consent_email():
        try:
            await email_service.send_consent_request(
                student_email=student.email,
                student_name=student.name,
                consent_token=student.consent_token,
            )
            logger.info(f"Consent email sent to {student.email}")
        except Exception as e:
            logger.error(f"Failed to send consent email to {student.email}: {e}")

    background_tasks.add_task(send_consent_email)

    return StudentPublic.model_validate(student)


@router.get("/{student_id}", response_model=StudentPublic)
def get_student(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
) -> StudentPublic:
    """
    Get a specific student by ID.
    """
    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    check_student_access(current_user, student, session)
    return StudentPublic.model_validate(student)


@router.patch("/{student_id}", response_model=StudentPublic)
def update_student(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
    student_in: StudentUpdate,
) -> StudentPublic:
    """
    Update a student's information.

    Only admins and superusers can update student information.
    """
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update students",
        )

    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Check email uniqueness if being changed
    if student_in.email and student_in.email != student.email:
        existing = crud.get_student_by_email(session=session, email=student_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A student with this email already exists",
            )

    student = crud.update_student(
        session=session, db_student=student, student_in=student_in
    )
    return StudentPublic.model_validate(student)


@router.delete("/{student_id}", response_model=Message)
def deactivate_student(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
) -> Message:
    """
    Deactivate a student (soft delete).

    Only admins and superusers can deactivate students.
    """
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can deactivate students",
        )

    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    crud.deactivate_student(session=session, db_student=student)
    return Message(message="Student deactivated successfully")


@router.post("/{student_id}/consent", response_model=StudentPublic)
def register_consent(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
) -> StudentPublic:
    """
    Register consent for a student.

    Only admins and superusers can register consent.
    """
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can register consent",
        )

    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if student.consent_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student has already given consent",
        )

    student = crud.register_consent(session=session, db_student=student)
    return StudentPublic.model_validate(student)


@router.delete("/{student_id}/consent", response_model=StudentPublic)
def revoke_consent(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
) -> StudentPublic:
    """
    Revoke consent for a student.

    Only admins and superusers can revoke consent.
    This will stop data collection for this student.
    """
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can revoke consent",
        )

    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    student = crud.revoke_consent(session=session, db_student=student)
    return StudentPublic.model_validate(student)


@router.get("/{student_id}/scores", response_model=ScoresPublic)
def get_student_scores(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
    limit: int = Query(default=50, le=100),
) -> ScoresPublic:
    """
    Get score history for a student.
    """
    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    check_student_access(current_user, student, session)

    scores = crud.get_student_scores(
        session=session, student_id=student_id, limit=limit
    )

    return ScoresPublic(
        data=[ScorePublic.model_validate(s) for s in scores],
        count=len(scores),
    )


@router.get("/{student_id}/interventions", response_model=InterventionsPublic)
def get_student_interventions(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> InterventionsPublic:
    """
    Get intervention history for a student.
    """
    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    check_student_access(current_user, student, session)

    interventions, count = crud.get_student_interventions(
        session=session,
        student_id=student_id,
        skip=skip,
        limit=limit,
    )

    return InterventionsPublic(
        data=[InterventionPublic.model_validate(i) for i in interventions],
        count=count,
    )


@router.post("/{student_id}/interventions", response_model=InterventionPublic)
def create_intervention(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
    intervention_in: InterventionCreate,
) -> InterventionPublic:
    """
    Log an intervention for a student.

    Mentors and FACT team members can log interventions for their assigned students.
    """
    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    check_student_access(current_user, student, session)

    # Override student_id from path
    intervention_in.student_id = student_id

    intervention = crud.create_intervention(
        session=session,
        intervention_in=intervention_in,
        user_id=current_user.id,
    )

    return InterventionPublic.model_validate(intervention)


@router.post("/{student_id}/send-survey", response_model=Message)
async def send_survey(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    request: SendSurveyRequest | None = None,
) -> Message:
    """
    Send a survey invitation email to a student.

    Creates a new survey session and sends an email with the survey link.
    Only admins and superusers can send surveys.
    Student must have given consent to receive surveys.
    Optionally include up to 2 custom questions.
    """
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can send surveys",
        )

    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    if not student.consent_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student has not given consent to receive surveys",
        )

    if student.status != StudentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send survey to inactive student",
        )

    # Validate custom questions
    custom_questions = None
    if request and request.custom_questions:
        if len(request.custom_questions) > 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 2 custom questions allowed",
            )
        # Filter out empty questions
        custom_questions = [q.strip() for q in request.custom_questions if q.strip()]
        if not custom_questions:
            custom_questions = None

    # Get current week number and year
    now = datetime.utcnow()
    week_number = now.isocalendar()[1]
    year = now.year

    # Create survey session
    survey_session = crud.create_survey_session(
        session=session,
        student_id=student.id,
        week_number=week_number,
        year=year,
        custom_questions=custom_questions,
    )

    # Send email in background
    async def send_survey_email():
        try:
            await email_service.send_survey_invitation(
                student_email=student.email,
                student_name=student.name,
                token=survey_session.token,
                week_number=week_number,
            )
            logger.info(f"Survey email sent to {student.email} for week {week_number}")
        except Exception as e:
            logger.error(f"Failed to send survey email to {student.email}: {e}")

    background_tasks.add_task(send_survey_email)

    return Message(message=f"Trivselstjek sendt til {student.name}")
