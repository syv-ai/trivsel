"""
Student-Mentor assignment routes.

Manages the relationship between students and their mentors/FACT team members.
Only admins can create and delete assignments.
"""

import uuid

from fastapi import APIRouter, HTTPException, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    AssignmentRole,
    Message,
    StaffRole,
    StudentAssignmentCreate,
    StudentAssignmentPublic,
)

router = APIRouter(prefix="/assignments", tags=["assignments"])


def check_admin_access(current_user: CurrentUser) -> None:
    """Verify user has admin access."""
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage assignments",
        )


@router.get("/student/{student_id}", response_model=list[StudentAssignmentPublic])
def get_student_assignments(
    session: SessionDep,
    current_user: CurrentUser,
    student_id: uuid.UUID,
) -> list[StudentAssignmentPublic]:
    """
    Get all assignments for a student.
    """
    # Verify student exists
    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    assignments = crud.get_student_assignments(session=session, student_id=student_id)
    return [StudentAssignmentPublic.model_validate(a) for a in assignments]


@router.get("/user/{user_id}", response_model=list[StudentAssignmentPublic])
def get_user_assignments(
    session: SessionDep,
    current_user: CurrentUser,
    user_id: uuid.UUID,
) -> list[StudentAssignmentPublic]:
    """
    Get all students assigned to a user.

    Users can view their own assignments.
    Admins can view any user's assignments.
    """
    # Non-admin users can only view their own assignments
    if user_id != current_user.id:
        check_admin_access(current_user)

    assignments = crud.get_user_assignments(session=session, user_id=user_id)
    return [StudentAssignmentPublic.model_validate(a) for a in assignments]


@router.get("/me", response_model=list[StudentAssignmentPublic])
def get_my_assignments(
    session: SessionDep,
    current_user: CurrentUser,
) -> list[StudentAssignmentPublic]:
    """
    Get current user's student assignments.
    """
    assignments = crud.get_user_assignments(session=session, user_id=current_user.id)
    return [StudentAssignmentPublic.model_validate(a) for a in assignments]


@router.post("/", response_model=StudentAssignmentPublic)
def create_assignment(
    session: SessionDep,
    current_user: CurrentUser,
    assignment_in: StudentAssignmentCreate,
) -> StudentAssignmentPublic:
    """
    Assign a student to a staff member.

    Only admins can create assignments.
    """
    check_admin_access(current_user)

    # Verify student exists
    student = crud.get_student(session=session, student_id=assignment_in.student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Check if assignment already exists
    if crud.is_user_assigned_to_student(
        session=session,
        user_id=assignment_in.user_id,
        student_id=assignment_in.student_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This assignment already exists",
        )

    assignment = crud.create_assignment(session=session, assignment_in=assignment_in)
    return StudentAssignmentPublic.model_validate(assignment)


@router.delete("/{assignment_id}", response_model=Message)
def delete_assignment(
    session: SessionDep,
    current_user: CurrentUser,
    assignment_id: uuid.UUID,
) -> Message:
    """
    Remove a student-staff assignment.

    Only admins can delete assignments.
    """
    check_admin_access(current_user)

    crud.delete_assignment(session=session, assignment_id=assignment_id)
    return Message(message="Assignment deleted successfully")
