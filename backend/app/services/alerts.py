"""
Alert service for monitoring student wellbeing and creating notifications.

Alert triggers:
1. Critical score (red) in total or any category
2. Significant score drop (>= 1.0 points)
3. Non-response after survey expiry
"""

import logging
import uuid
from datetime import datetime

from sqlmodel import Session

from app import crud
from app.models import (
    Notification,
    NotificationCreate,
    NotificationType,
    Score,
    ScoreColor,
    SessionStatus,
    Student,
    SurveySession,
)
from app.services.scoring import detect_score_drop, get_previous_total_score

logger = logging.getLogger(__name__)


async def check_for_alerts(
    *,
    db_session: Session,
    survey_session: SurveySession,
    scores: list[Score],
    student: Student,
) -> list[Notification]:
    """
    Check for alert conditions after a survey is completed.

    Checks:
    1. Any red (critical) scores
    2. Significant score drop from previous session

    Args:
        db_session: Database session
        survey_session: The completed survey session
        scores: List of scores calculated for this session
        student: The student who completed the survey

    Returns:
        List of created notifications
    """
    notifications: list[Notification] = []

    # Get mentors assigned to this student
    assignments = crud.get_student_assignments(
        session=db_session, student_id=student.id
    )

    if not assignments:
        logger.warning(f"No mentors assigned to student {student.id}")
        return notifications

    # Check for critical (red) scores
    red_scores = [s for s in scores if s.color == ScoreColor.RED]
    if red_scores:
        # Get total score for the message
        total_score = next((s for s in scores if s.is_total), None)
        score_value = total_score.score_value if total_score else "N/A"

        # Find which categories are red
        red_categories = [s.category.value for s in red_scores if s.category]

        message = f"Eleven har en kritisk trivselsscore på {score_value}."
        if red_categories:
            message += f" Kritiske kategorier: {', '.join(red_categories)}."

        # Create notification for each assigned mentor
        for assignment in assignments:
            notification = crud.create_notification(
                session=db_session,
                notification_in=NotificationCreate(
                    student_id=student.id,
                    user_id=assignment.user_id,
                    type=NotificationType.CRITICAL_SCORE,
                    title=f"Kritisk score: {student.name}",
                    message=message,
                ),
            )
            notifications.append(notification)
            logger.info(
                f"Created critical score alert for student {student.id} "
                f"to mentor {assignment.user_id}"
            )

    # Check for score drop
    total_score = next((s for s in scores if s.is_total), None)
    if total_score:
        previous_score = get_previous_total_score(
            db_session=db_session,
            student_id=student.id,
            exclude_session_id=survey_session.id,
        )

        if detect_score_drop(total_score.score_value, previous_score):
            drop_amount = round(previous_score - total_score.score_value, 1)
            message = (
                f"Elevens trivselsscore er faldet med {drop_amount} point "
                f"(fra {previous_score} til {total_score.score_value})."
            )

            for assignment in assignments:
                notification = crud.create_notification(
                    session=db_session,
                    notification_in=NotificationCreate(
                        student_id=student.id,
                        user_id=assignment.user_id,
                        type=NotificationType.SCORE_DROP,
                        title=f"Fald i trivsel: {student.name}",
                        message=message,
                    ),
                )
                notifications.append(notification)
                logger.info(
                    f"Created score drop alert for student {student.id} "
                    f"to mentor {assignment.user_id}"
                )

    return notifications


async def process_non_response(
    *,
    db_session: Session,
    survey_session: SurveySession,
    student: Student,
) -> list[Notification]:
    """
    Create alerts for non-response after survey expiry.

    "Non-respons er også et svar" - non-response should trigger attention.

    Args:
        db_session: Database session
        survey_session: The expired survey session
        student: The student who didn't respond

    Returns:
        List of created notifications
    """
    notifications: list[Notification] = []

    # Get mentors assigned to this student
    assignments = crud.get_student_assignments(
        session=db_session, student_id=student.id
    )

    if not assignments:
        logger.warning(f"No mentors assigned to student {student.id}")
        return notifications

    # Count consecutive non-responses
    recent_sessions = crud.get_student_sessions(
        session=db_session,
        student_id=student.id,
        limit=5,
    )
    consecutive_non_responses = 0
    for sess in recent_sessions:
        if sess.status in [SessionStatus.NON_RESPONSE, SessionStatus.EXPIRED]:
            consecutive_non_responses += 1
        else:
            break

    message = (
        f"Eleven har ikke besvaret trivselstjekket for uge {survey_session.week_number}."
    )
    if consecutive_non_responses > 1:
        message += f" Dette er {consecutive_non_responses}. uge i træk uden svar."

    for assignment in assignments:
        notification = crud.create_notification(
            session=db_session,
            notification_in=NotificationCreate(
                student_id=student.id,
                user_id=assignment.user_id,
                type=NotificationType.NON_RESPONSE,
                title=f"Manglende besvarelse: {student.name}",
                message=message,
            ),
        )
        notifications.append(notification)
        logger.info(
            f"Created non-response alert for student {student.id} "
            f"to mentor {assignment.user_id}"
        )

    return notifications


async def process_expired_sessions(*, db_session: Session) -> int:
    """
    Process all expired survey sessions and create non-response alerts.

    Should be called periodically (e.g., daily) to mark expired sessions
    and create appropriate notifications.

    Args:
        db_session: Database session

    Returns:
        Number of sessions processed
    """
    expired_sessions = crud.get_expired_sessions(session=db_session)
    processed_count = 0

    for survey_session in expired_sessions:
        # Update session status to non_response
        crud.update_session_status(
            session=db_session,
            db_session=survey_session,
            status=SessionStatus.NON_RESPONSE,
        )

        # Get the student
        student = crud.get_student(session=db_session, student_id=survey_session.student_id)
        if student:
            await process_non_response(
                db_session=db_session,
                survey_session=survey_session,
                student=student,
            )

        processed_count += 1
        logger.info(f"Processed expired session {survey_session.id}")

    return processed_count


def get_alert_summary_for_mentor(
    *,
    db_session: Session,
    user_id: uuid.UUID,
) -> dict:
    """
    Get a summary of alerts for a mentor.

    Args:
        db_session: Database session
        user_id: Mentor's user ID

    Returns:
        Dictionary with alert counts by type
    """
    notifications, total_count = crud.get_user_notifications(
        session=db_session,
        user_id=user_id,
        unread_only=True,
        limit=100,
    )

    summary = {
        "total_unread": total_count,
        "critical_score": 0,
        "score_drop": 0,
        "non_response": 0,
        "other": 0,
    }

    for notification in notifications:
        if notification.type == NotificationType.CRITICAL_SCORE:
            summary["critical_score"] += 1
        elif notification.type == NotificationType.SCORE_DROP:
            summary["score_drop"] += 1
        elif notification.type == NotificationType.NON_RESPONSE:
            summary["non_response"] += 1
        else:
            summary["other"] += 1

    return summary
