"""
Scoring service for calculating wellbeing scores.

Scoring logic:
- Each survey has 15 questions across 5 categories (3 questions per category)
- Each answer is on a 1-5 scale
- Category score = average of responses in that category
- Total score = average of all category scores (or all responses)

Color thresholds (configurable):
- Green: >= 4.0 (4-5)
- Yellow: >= 3.0 and < 4.0 (3-3.9)
- Red: < 3.0 (1-2.9)
"""

import uuid
from collections import defaultdict

from sqlmodel import Session

from app import crud
from app.core.config import settings
from app.models import (
    Score,
    ScoreColor,
    SurveyCategory,
    SurveyResponse,
    SurveySession,
)


def determine_color(score: float) -> ScoreColor:
    """
    Determine the traffic light color based on score.

    Args:
        score: Score value between 1.0 and 5.0

    Returns:
        ScoreColor enum value (GREEN, YELLOW, or RED)
    """
    if score >= settings.SCORE_GREEN_MIN:
        return ScoreColor.GREEN
    elif score >= settings.SCORE_YELLOW_MIN:
        return ScoreColor.YELLOW
    else:
        return ScoreColor.RED


def calculate_category_score(
    responses: list[SurveyResponse],
    category: SurveyCategory,
    session: Session,
) -> float | None:
    """
    Calculate the average score for a specific category.

    Args:
        responses: List of survey responses
        category: The category to calculate score for
        session: Database session for fetching question data

    Returns:
        Average score for the category, or None if no responses for that category
    """
    category_responses = []

    for response in responses:
        question = crud.get_question(session=session, question_id=response.question_id)
        if question and question.category == category:
            category_responses.append(response.answer)

    if not category_responses:
        return None

    return sum(category_responses) / len(category_responses)


def calculate_total_score(category_scores: dict[SurveyCategory, float]) -> float:
    """
    Calculate the total wellbeing score from category scores.

    Args:
        category_scores: Dictionary mapping categories to their scores

    Returns:
        Average of all category scores
    """
    scores = list(category_scores.values())
    if not scores:
        return 0.0
    return sum(scores) / len(scores)


def calculate_all_scores(
    responses: list[SurveyResponse],
    session: Session,
) -> tuple[dict[SurveyCategory, float], float]:
    """
    Calculate all category scores and total score.

    Args:
        responses: List of survey responses
        session: Database session

    Returns:
        Tuple of (category_scores dict, total_score)
    """
    # Group responses by category
    category_answers: dict[SurveyCategory, list[int]] = defaultdict(list)

    for response in responses:
        question = crud.get_question(session=session, question_id=response.question_id)
        if question:
            category_answers[question.category].append(response.answer)

    # Calculate category scores
    category_scores: dict[SurveyCategory, float] = {}
    for category, answers in category_answers.items():
        if answers:
            category_scores[category] = sum(answers) / len(answers)

    # Calculate total score
    total_score = calculate_total_score(category_scores)

    return category_scores, total_score


def detect_score_drop(
    current_score: float,
    previous_score: float | None,
    threshold: float = 1.0,
) -> bool:
    """
    Detect if there's a significant score drop between measurements.

    Args:
        current_score: Current total score
        previous_score: Previous total score (or None if no previous)
        threshold: Minimum drop to consider significant (default 1.0)

    Returns:
        True if there's a significant drop, False otherwise
    """
    if previous_score is None:
        return False

    drop = previous_score - current_score
    return drop >= threshold


def save_scores_for_session(
    *,
    db_session: Session,
    survey_session: SurveySession,
    responses: list[SurveyResponse],
) -> list[Score]:
    """
    Calculate and save all scores for a completed survey session.

    Args:
        db_session: Database session
        survey_session: The survey session that was completed
        responses: List of survey responses

    Returns:
        List of created Score objects
    """
    category_scores, total_score = calculate_all_scores(responses, db_session)

    created_scores: list[Score] = []

    # Save category scores
    for category, score_value in category_scores.items():
        color = determine_color(score_value)
        score = crud.create_score(
            session=db_session,
            student_id=survey_session.student_id,
            session_id=survey_session.id,
            category=category,
            score_value=round(score_value, 2),
            color=color,
            is_total=False,
        )
        created_scores.append(score)

    # Save total score
    total_color = determine_color(total_score)
    total_score_obj = crud.create_score(
        session=db_session,
        student_id=survey_session.student_id,
        session_id=survey_session.id,
        category=None,
        score_value=round(total_score, 2),
        color=total_color,
        is_total=True,
    )
    created_scores.append(total_score_obj)

    return created_scores


def get_previous_total_score(
    *,
    db_session: Session,
    student_id: uuid.UUID,
    exclude_session_id: uuid.UUID | None = None,
) -> float | None:
    """
    Get the previous total score for a student.

    Args:
        db_session: Database session
        student_id: Student's UUID
        exclude_session_id: Optional session ID to exclude from search

    Returns:
        Previous total score or None if no previous score exists
    """
    scores = crud.get_student_scores(
        session=db_session,
        student_id=student_id,
        limit=10,
    )

    # Find the latest total score that's not from the excluded session
    for score in scores:
        if score.is_total and score.session_id != exclude_session_id:
            return score.score_value

    return None


def analyze_score_trend(
    *,
    db_session: Session,
    student_id: uuid.UUID,
    num_weeks: int = 4,
) -> dict:
    """
    Analyze score trends for a student over recent weeks.

    Args:
        db_session: Database session
        student_id: Student's UUID
        num_weeks: Number of weeks to analyze

    Returns:
        Dictionary with trend analysis:
        - scores: list of total scores (most recent first)
        - trend: "improving", "declining", or "stable"
        - average: average score over period
    """
    scores = crud.get_student_scores(
        session=db_session,
        student_id=student_id,
        limit=num_weeks * 6,  # Roughly 6 scores per session (5 categories + 1 total)
    )

    # Extract just total scores
    total_scores = [s.score_value for s in scores if s.is_total][:num_weeks]

    if not total_scores:
        return {
            "scores": [],
            "trend": "stable",
            "average": 0.0,
        }

    average = sum(total_scores) / len(total_scores)

    # Determine trend (comparing first half to second half)
    if len(total_scores) >= 2:
        # Most recent is first, so recent avg vs older avg
        mid = len(total_scores) // 2
        recent_avg = sum(total_scores[:mid]) / mid
        older_avg = sum(total_scores[mid:]) / (len(total_scores) - mid)

        if recent_avg - older_avg > 0.3:
            trend = "improving"
        elif older_avg - recent_avg > 0.3:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "stable"

    return {
        "scores": total_scores,
        "trend": trend,
        "average": round(average, 2),
    }
