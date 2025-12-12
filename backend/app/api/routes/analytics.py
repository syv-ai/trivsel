"""
Analytics and data export routes.

Provides anonymized data export for researchers (CBS) and aggregate statistics.
Only analysts and admins can access these routes.
"""

import io
import csv
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    AnalyticsExportRow,
    AnalyticsSummary,
    ScoreColor,
    SessionStatus,
    StaffRole,
)
from sqlmodel import select, func

router = APIRouter(prefix="/analytics", tags=["analytics"])


def check_analyst_access(current_user: CurrentUser) -> None:
    """Verify user has analyst or admin access."""
    if not current_user.is_superuser and current_user.role not in [
        StaffRole.ADMIN,
        StaffRole.ANALYST,
    ]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only analysts and admins can access analytics",
        )


@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    session: SessionDep,
    current_user: CurrentUser,
) -> AnalyticsSummary:
    """
    Get aggregate statistics for the platform.
    """
    check_analyst_access(current_user)

    from app.models import Student, SurveySession, SurveyResponse, Score

    # Count students
    total_students = session.exec(
        select(func.count(Student.id)).where(Student.consent_status == True)
    ).one()

    # Count sessions
    total_sessions = session.exec(
        select(func.count(SurveySession.id))
    ).one()

    # Count completed sessions
    completed_sessions = session.exec(
        select(func.count(SurveySession.id)).where(
            SurveySession.status == SessionStatus.COMPLETED
        )
    ).one()

    # Count responses
    total_responses = session.exec(
        select(func.count(SurveyResponse.id))
    ).one()

    # Calculate response rate
    response_rate = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0

    # Get average total score
    avg_score_result = session.exec(
        select(func.avg(Score.score_value)).where(Score.is_total == True)
    ).one()
    average_score = float(avg_score_result) if avg_score_result else 0.0

    # Count score distribution
    green_count = session.exec(
        select(func.count(Score.id)).where(
            Score.is_total == True, Score.color == ScoreColor.GREEN
        )
    ).one()

    yellow_count = session.exec(
        select(func.count(Score.id)).where(
            Score.is_total == True, Score.color == ScoreColor.YELLOW
        )
    ).one()

    red_count = session.exec(
        select(func.count(Score.id)).where(
            Score.is_total == True, Score.color == ScoreColor.RED
        )
    ).one()

    return AnalyticsSummary(
        total_students=total_students,
        total_sessions=total_sessions,
        total_responses=total_responses,
        response_rate=round(response_rate, 1),
        average_score=round(average_score, 2),
        score_distribution={
            "green": green_count,
            "yellow": yellow_count,
            "red": red_count,
        },
    )


@router.get("/export")
def export_data(
    session: SessionDep,
    current_user: CurrentUser,
    format: str = Query(default="csv", regex="^(csv|json)$"),
    from_date: datetime | None = None,
    to_date: datetime | None = None,
):
    """
    Export anonymized data for research.

    Data is pseudonymized using internal IDs - no personal information
    (names, emails) is included in the export.

    Parameters:
    - format: Export format (csv or json)
    - from_date: Filter data from this date
    - to_date: Filter data until this date
    """
    check_analyst_access(current_user)

    from app.models import Student, Score, SurveySession

    # Build query for scores with student and session info
    statement = (
        select(Score, Student, SurveySession)
        .join(Student, Score.student_id == Student.id)
        .join(SurveySession, Score.session_id == SurveySession.id)
        .where(Student.consent_status == True)
    )

    if from_date:
        statement = statement.where(Score.calculated_at >= from_date)
    if to_date:
        statement = statement.where(Score.calculated_at <= to_date)

    statement = statement.order_by(Score.calculated_at.desc())

    results = session.exec(statement).all()

    # Build export data
    export_rows = []
    for score, student, survey_session in results:
        row = AnalyticsExportRow(
            internal_id=student.internal_id,
            week_number=survey_session.week_number,
            year=survey_session.year,
            phase=student.phase,
            category=score.category,
            score=score.score_value,
            color=score.color,
            is_total=score.is_total,
            completed_at=score.calculated_at,
        )
        export_rows.append(row)

    if format == "json":
        return [row.model_dump() for row in export_rows]

    # CSV export
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "internal_id",
        "week_number",
        "year",
        "phase",
        "category",
        "score",
        "color",
        "is_total",
        "completed_at",
    ])

    # Data rows
    for row in export_rows:
        writer.writerow([
            row.internal_id,
            row.week_number,
            row.year,
            row.phase.value,
            row.category.value if row.category else "",
            row.score,
            row.color.value,
            row.is_total,
            row.completed_at.isoformat(),
        ])

    output.seek(0)

    # Return as downloadable file
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=trivselstracker_export_{datetime.now().strftime('%Y%m%d')}.csv"
        },
    )
