"""
Survey question management routes.

Only admins can create, update, and delete questions.
All authenticated users can view questions.
"""

import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Message,
    QuestionPhase,
    QuestionReorder,
    StaffRole,
    SurveyCategory,
    SurveyQuestionCreate,
    SurveyQuestionPublic,
    SurveyQuestionsPublic,
    SurveyQuestionUpdate,
)

router = APIRouter(prefix="/questions", tags=["questions"])


def check_admin_access(current_user: CurrentUser) -> None:
    """Verify user has admin access."""
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage questions",
        )


@router.get("/", response_model=SurveyQuestionsPublic)
def get_questions(
    session: SessionDep,
    current_user: CurrentUser,
    category: SurveyCategory | None = None,
    phase: QuestionPhase | None = None,
    is_active: bool | None = Query(default=None),
    skip: int = 0,
    limit: int = 100,
) -> SurveyQuestionsPublic:
    """
    Get list of survey questions.

    Filters:
    - category: Filter by question category
    - phase: Filter by student phase
    - is_active: Filter by active status (default: all)
    """
    questions, count = crud.get_questions(
        session=session,
        category=category,
        phase=phase,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )

    return SurveyQuestionsPublic(
        data=[SurveyQuestionPublic.model_validate(q) for q in questions],
        count=count,
    )


@router.post("/", response_model=SurveyQuestionPublic)
def create_question(
    session: SessionDep,
    current_user: CurrentUser,
    question_in: SurveyQuestionCreate,
) -> SurveyQuestionPublic:
    """
    Create a new survey question.

    Only admins can create questions.
    """
    check_admin_access(current_user)

    question = crud.create_question(session=session, question_in=question_in)
    return SurveyQuestionPublic.model_validate(question)


@router.get("/{question_id}", response_model=SurveyQuestionPublic)
def get_question(
    session: SessionDep,
    current_user: CurrentUser,
    question_id: uuid.UUID,
) -> SurveyQuestionPublic:
    """
    Get a specific question by ID.
    """
    question = crud.get_question(session=session, question_id=question_id)

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    return SurveyQuestionPublic.model_validate(question)


@router.patch("/{question_id}", response_model=SurveyQuestionPublic)
def update_question(
    session: SessionDep,
    current_user: CurrentUser,
    question_id: uuid.UUID,
    question_in: SurveyQuestionUpdate,
) -> SurveyQuestionPublic:
    """
    Update a survey question.

    Only admins can update questions.
    """
    check_admin_access(current_user)

    question = crud.get_question(session=session, question_id=question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    question = crud.update_question(
        session=session, db_question=question, question_in=question_in
    )
    return SurveyQuestionPublic.model_validate(question)


@router.delete("/{question_id}", response_model=Message)
def delete_question(
    session: SessionDep,
    current_user: CurrentUser,
    question_id: uuid.UUID,
) -> Message:
    """
    Delete a survey question.

    Only admins can delete questions.
    Note: This will also delete all responses to this question.
    """
    check_admin_access(current_user)

    question = crud.get_question(session=session, question_id=question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    crud.delete_question(session=session, db_question=question)
    return Message(message="Question deleted successfully")


@router.post("/reorder", response_model=Message)
def reorder_questions(
    session: SessionDep,
    current_user: CurrentUser,
    reorder: QuestionReorder,
) -> Message:
    """
    Reorder questions based on provided list of IDs.

    The order of IDs in the list determines the new order.
    Only admins can reorder questions.
    """
    check_admin_access(current_user)

    # Verify all question IDs exist
    for question_id in reorder.question_ids:
        question = crud.get_question(session=session, question_id=question_id)
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {question_id} not found",
            )

    crud.reorder_questions(session=session, question_ids=reorder.question_ids)
    return Message(message="Questions reordered successfully")
