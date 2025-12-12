"""
Public consent management routes.

These routes do NOT require authentication - they use secure tokens
sent via email to allow students to accept or decline consent.
"""

from fastapi import APIRouter, HTTPException, status
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import Student, Message
from datetime import datetime

router = APIRouter(prefix="/consent", tags=["consent"])


@router.get("/{token}")
def get_consent_status(
    session: SessionDep,
    token: str,
) -> dict:
    """
    Get consent status for a token.
    Used by frontend to show appropriate page.
    """
    statement = select(Student).where(Student.consent_token == token)
    student = session.exec(statement).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ugyldigt eller udløbet link",
        )

    return {
        "student_name": student.name,
        "consent_status": student.consent_status,
        "already_responded": student.consent_date is not None,
    }


@router.post("/{token}/accept", response_model=Message)
def accept_consent(
    session: SessionDep,
    token: str,
) -> Message:
    """
    Accept consent using email token.
    """
    statement = select(Student).where(Student.consent_token == token)
    student = session.exec(statement).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ugyldigt eller udløbet link",
        )

    # Update consent
    student.consent_status = True
    student.consent_date = datetime.utcnow()
    # Clear the token after use (optional - keeps it for re-access)
    # student.consent_token = None

    session.add(student)
    session.commit()

    return Message(message="Tak! Dit samtykke er registreret. Du vil modtage dit første trivselstjek snart.")


@router.post("/{token}/decline", response_model=Message)
def decline_consent(
    session: SessionDep,
    token: str,
) -> Message:
    """
    Decline consent using email token.
    """
    statement = select(Student).where(Student.consent_token == token)
    student = session.exec(statement).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ugyldigt eller udløbet link",
        )

    # Update consent
    student.consent_status = False
    student.consent_date = datetime.utcnow()
    # Clear the token after use (optional - keeps it for re-access)
    # student.consent_token = None

    session.add(student)
    session.commit()

    return Message(message="Dit valg er registreret. Du vil ikke modtage trivselstjek.")
