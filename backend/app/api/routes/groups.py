"""
Group management routes.

Groups are used to organize students (e.g., by class, program, etc.).
Only admins can manage groups.
"""

import uuid

from fastapi import APIRouter, HTTPException, status

from app import crud
from app.api.deps import CurrentUser, SessionDep
from app.models import (
    GroupCreate,
    GroupMembershipCreate,
    GroupPublic,
    GroupsPublic,
    GroupUpdate,
    Message,
    StaffRole,
    StudentPublic,
)

router = APIRouter(prefix="/groups", tags=["groups"])


def check_admin_access(current_user: CurrentUser) -> None:
    """Verify user has admin access."""
    if not current_user.is_superuser and current_user.role != StaffRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can manage groups",
        )


@router.get("/", response_model=GroupsPublic)
def get_groups(
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 100,
) -> GroupsPublic:
    """
    Get list of groups.
    """
    groups, count = crud.get_groups(session=session, skip=skip, limit=limit)

    return GroupsPublic(
        data=[GroupPublic.model_validate(g) for g in groups],
        count=count,
    )


@router.post("/", response_model=GroupPublic)
def create_group(
    session: SessionDep,
    current_user: CurrentUser,
    group_in: GroupCreate,
) -> GroupPublic:
    """
    Create a new group.

    Only admins can create groups.
    """
    check_admin_access(current_user)

    group = crud.create_group(session=session, group_in=group_in)
    return GroupPublic.model_validate(group)


@router.get("/{group_id}", response_model=GroupPublic)
def get_group(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: uuid.UUID,
) -> GroupPublic:
    """
    Get a specific group by ID.
    """
    group = crud.get_group(session=session, group_id=group_id)

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    return GroupPublic.model_validate(group)


@router.patch("/{group_id}", response_model=GroupPublic)
def update_group(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: uuid.UUID,
    group_in: GroupUpdate,
) -> GroupPublic:
    """
    Update a group.

    Only admins can update groups.
    """
    check_admin_access(current_user)

    group = crud.get_group(session=session, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    group = crud.update_group(session=session, db_group=group, group_in=group_in)
    return GroupPublic.model_validate(group)


@router.delete("/{group_id}", response_model=Message)
def delete_group(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: uuid.UUID,
) -> Message:
    """
    Delete a group.

    Only admins can delete groups.
    Note: This will remove all students from the group but not delete the students.
    """
    check_admin_access(current_user)

    group = crud.get_group(session=session, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    crud.delete_group(session=session, db_group=group)
    return Message(message="Group deleted successfully")


@router.get("/{group_id}/members", response_model=list[StudentPublic])
def get_group_members(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: uuid.UUID,
) -> list[StudentPublic]:
    """
    Get all students in a group.
    """
    group = crud.get_group(session=session, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    students = crud.get_group_members(session=session, group_id=group_id)
    return [StudentPublic.model_validate(s) for s in students]


@router.post("/{group_id}/members", response_model=Message)
def add_member_to_group(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: uuid.UUID,
    student_id: uuid.UUID,
) -> Message:
    """
    Add a student to a group.

    Only admins can manage group membership.
    """
    check_admin_access(current_user)

    # Verify group exists
    group = crud.get_group(session=session, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    # Verify student exists
    student = crud.get_student(session=session, student_id=student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    # Add membership
    membership_in = GroupMembershipCreate(student_id=student_id, group_id=group_id)
    crud.add_student_to_group(session=session, membership_in=membership_in)

    return Message(message="Student added to group successfully")


@router.delete("/{group_id}/members/{student_id}", response_model=Message)
def remove_member_from_group(
    session: SessionDep,
    current_user: CurrentUser,
    group_id: uuid.UUID,
    student_id: uuid.UUID,
) -> Message:
    """
    Remove a student from a group.

    Only admins can manage group membership.
    """
    check_admin_access(current_user)

    # Verify group exists
    group = crud.get_group(session=session, group_id=group_id)
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found",
        )

    crud.remove_student_from_group(
        session=session, student_id=student_id, group_id=group_id
    )

    return Message(message="Student removed from group successfully")
