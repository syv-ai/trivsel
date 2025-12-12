"""
Public survey routes for students.

These routes are accessed via unique tokens and do not require authentication.
Students receive a link with their token via email.
"""

from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from sqlmodel import Session

from app import crud
from app.api.deps import SessionDep
from app.models import (
    Message,
    SessionStatus,
    SurveyInfo,
    SurveyQuestionPublic,
    SurveyResponseBulkCreate,
    SurveySubmitResponse,
)
from app.services import alerts, scoring

router = APIRouter(prefix="/survey", tags=["survey"])


@router.get("/{token}", response_model=SurveyInfo)
def get_survey(token: str, session: SessionDep) -> SurveyInfo:
    """
    Get survey information and questions for a given token.

    This is the entry point for students to access their weekly survey.
    """
    survey_session = crud.get_survey_session_by_token(session=session, token=token)

    if not survey_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    # Check if token has expired
    if survey_session.token_expires_at < datetime.utcnow():
        # Mark as expired if not already
        if survey_session.status not in [SessionStatus.EXPIRED, SessionStatus.NON_RESPONSE]:
            crud.update_session_status(
                session=session,
                db_session=survey_session,
                status=SessionStatus.EXPIRED,
            )
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Survey link has expired",
        )

    # Check if already completed
    if survey_session.status == SessionStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Survey already completed",
        )

    # Get the student
    student = crud.get_student(session=session, student_id=survey_session.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Check consent
    if not student.consent_status:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student has not given consent",
        )

    # Get questions applicable to this student's phase
    questions = crud.get_questions_for_student(
        session=session, student_phase=student.phase
    )

    # Update status to in_progress if pending
    if survey_session.status == SessionStatus.PENDING:
        crud.update_session_status(
            session=session,
            db_session=survey_session,
            status=SessionStatus.IN_PROGRESS,
        )

    return SurveyInfo(
        student_name=student.name,
        week_number=survey_session.week_number,
        year=survey_session.year,
        questions=[SurveyQuestionPublic.model_validate(q) for q in questions],
        status=survey_session.status,
    )


@router.get("/{token}/status")
def get_survey_status(token: str, session: SessionDep) -> dict:
    """
    Check the status of a survey session.
    """
    survey_session = crud.get_survey_session_by_token(session=session, token=token)

    if not survey_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    return {
        "status": survey_session.status,
        "week_number": survey_session.week_number,
        "year": survey_session.year,
        "completed_at": survey_session.completed_at,
    }


@router.post("/{token}/responses", response_model=SurveySubmitResponse)
async def submit_responses(
    token: str,
    responses: SurveyResponseBulkCreate,
    session: SessionDep,
) -> SurveySubmitResponse:
    """
    Submit all responses for a survey.

    All responses should be submitted together in a single request.
    After submission, scores are calculated and the session is marked as complete.
    """
    survey_session = crud.get_survey_session_by_token(session=session, token=token)

    if not survey_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Survey not found",
        )

    # Check if token has expired
    if survey_session.token_expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Survey link has expired",
        )

    # Check if already completed
    if survey_session.status == SessionStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Survey already completed",
        )

    # Get the student
    student = crud.get_student(session=session, student_id=survey_session.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Get expected questions for validation
    expected_questions = crud.get_questions_for_student(
        session=session, student_phase=student.phase
    )
    expected_question_ids = {q.id for q in expected_questions}

    # Validate that all expected questions have responses
    submitted_question_ids = {r.question_id for r in responses.responses}
    missing_questions = expected_question_ids - submitted_question_ids

    if missing_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing responses for {len(missing_questions)} questions",
        )

    # Validate that no extra questions were submitted
    extra_questions = submitted_question_ids - expected_question_ids
    if extra_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid question IDs in responses",
        )

    # Create responses
    db_responses = crud.create_responses_bulk(
        session=session,
        session_id=survey_session.id,
        responses=responses.responses,
    )

    # Calculate and save scores
    scores = scoring.save_scores_for_session(
        db_session=session,
        survey_session=survey_session,
        responses=db_responses,
    )

    # Mark session as completed
    crud.update_session_status(
        session=session,
        db_session=survey_session,
        status=SessionStatus.COMPLETED,
    )

    # Check for alerts
    await alerts.check_for_alerts(
        db_session=session,
        survey_session=survey_session,
        scores=scores,
        student=student,
    )

    # Get total score for response
    total_score = next((s for s in scores if s.is_total), None)

    return SurveySubmitResponse(
        message="Tak for dit svar! Dine besvarelser er registreret.",
        total_score=total_score.score_value if total_score else 0.0,
        color=total_score.color if total_score else "green",
    )
