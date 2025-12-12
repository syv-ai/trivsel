import uuid
import secrets
from datetime import datetime, timedelta
from typing import Any

from sqlmodel import Session, select, func

from app.core.security import get_password_hash, verify_password
from app.models import (
    # User models
    User,
    UserCreate,
    UserUpdate,
    # Student models
    Student,
    StudentCreate,
    StudentUpdate,
    StudentStatus,
    StudentPhase,
    # Group models
    Group,
    GroupCreate,
    GroupUpdate,
    GroupMembership,
    GroupMembershipCreate,
    # Assignment models
    StudentAssignment,
    StudentAssignmentCreate,
    AssignmentRole,
    # Survey models
    SurveyQuestion,
    SurveyQuestionCreate,
    SurveyQuestionUpdate,
    SurveyCategory,
    QuestionPhase,
    SurveySession,
    SurveySessionCreate,
    SessionStatus,
    SurveyResponse,
    SurveyResponseCreate,
    # Score models
    Score,
    ScoreColor,
    # Intervention models
    Intervention,
    InterventionCreate,
    # Notification models
    Notification,
    NotificationCreate,
    NotificationType,
    # Audit log models
    AuditLog,
    AuditLogCreate,
)


# =============================================================================
# USER CRUD
# =============================================================================


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


# =============================================================================
# STUDENT CRUD
# =============================================================================


def create_student(*, session: Session, student_in: StudentCreate) -> Student:
    # Generate a consent token for the student
    consent_token = secrets.token_urlsafe(32)
    db_student = Student.model_validate(
        student_in,
        update={"consent_token": consent_token}
    )
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student


def get_student(*, session: Session, student_id: uuid.UUID) -> Student | None:
    return session.get(Student, student_id)


def get_student_by_email(*, session: Session, email: str) -> Student | None:
    statement = select(Student).where(Student.email == email)
    return session.exec(statement).first()


def get_student_by_internal_id(*, session: Session, internal_id: str) -> Student | None:
    statement = select(Student).where(Student.internal_id == internal_id)
    return session.exec(statement).first()


def get_students(
    *,
    session: Session,
    skip: int = 0,
    limit: int = 100,
    status: StudentStatus | None = None,
) -> tuple[list[Student], int]:
    statement = select(Student)
    if status:
        statement = statement.where(Student.status == status)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit).order_by(Student.name)
    students = list(session.exec(statement).all())
    return students, count


def get_students_by_mentor(
    *,
    session: Session,
    user_id: uuid.UUID,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[Student], int]:
    """Get students assigned to a specific mentor/staff user"""
    statement = (
        select(Student)
        .join(StudentAssignment, Student.id == StudentAssignment.student_id)
        .where(StudentAssignment.user_id == user_id)
        .where(Student.status == StudentStatus.ACTIVE)
    )

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit).order_by(Student.name)
    students = list(session.exec(statement).all())
    return students, count


def update_student(
    *, session: Session, db_student: Student, student_in: StudentUpdate
) -> Student:
    student_data = student_in.model_dump(exclude_unset=True)
    db_student.sqlmodel_update(student_data)
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student


def register_consent(*, session: Session, db_student: Student) -> Student:
    db_student.consent_status = True
    db_student.consent_date = datetime.utcnow()
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student


def revoke_consent(*, session: Session, db_student: Student) -> Student:
    db_student.consent_status = False
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student


def deactivate_student(*, session: Session, db_student: Student) -> Student:
    db_student.status = StudentStatus.INACTIVE
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student


# =============================================================================
# GROUP CRUD
# =============================================================================


def create_group(*, session: Session, group_in: GroupCreate) -> Group:
    db_group = Group.model_validate(group_in)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group


def get_group(*, session: Session, group_id: uuid.UUID) -> Group | None:
    return session.get(Group, group_id)


def get_groups(
    *, session: Session, skip: int = 0, limit: int = 100
) -> tuple[list[Group], int]:
    statement = select(Group)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit).order_by(Group.name)
    groups = list(session.exec(statement).all())
    return groups, count


def update_group(*, session: Session, db_group: Group, group_in: GroupUpdate) -> Group:
    group_data = group_in.model_dump(exclude_unset=True)
    db_group.sqlmodel_update(group_data)
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group


def delete_group(*, session: Session, db_group: Group) -> None:
    session.delete(db_group)
    session.commit()


def add_student_to_group(
    *, session: Session, membership_in: GroupMembershipCreate
) -> GroupMembership:
    db_membership = GroupMembership.model_validate(membership_in)
    session.add(db_membership)
    session.commit()
    session.refresh(db_membership)
    return db_membership


def remove_student_from_group(
    *, session: Session, student_id: uuid.UUID, group_id: uuid.UUID
) -> None:
    statement = select(GroupMembership).where(
        GroupMembership.student_id == student_id,
        GroupMembership.group_id == group_id,
    )
    membership = session.exec(statement).first()
    if membership:
        session.delete(membership)
        session.commit()


def get_group_members(
    *, session: Session, group_id: uuid.UUID
) -> list[Student]:
    statement = (
        select(Student)
        .join(GroupMembership, Student.id == GroupMembership.student_id)
        .where(GroupMembership.group_id == group_id)
    )
    return list(session.exec(statement).all())


# =============================================================================
# STUDENT ASSIGNMENT CRUD
# =============================================================================


def create_assignment(
    *, session: Session, assignment_in: StudentAssignmentCreate
) -> StudentAssignment:
    db_assignment = StudentAssignment.model_validate(assignment_in)
    session.add(db_assignment)
    session.commit()
    session.refresh(db_assignment)
    return db_assignment


def get_student_assignments(
    *, session: Session, student_id: uuid.UUID
) -> list[StudentAssignment]:
    statement = select(StudentAssignment).where(
        StudentAssignment.student_id == student_id
    )
    return list(session.exec(statement).all())


def get_user_assignments(
    *, session: Session, user_id: uuid.UUID
) -> list[StudentAssignment]:
    statement = select(StudentAssignment).where(StudentAssignment.user_id == user_id)
    return list(session.exec(statement).all())


def delete_assignment(*, session: Session, assignment_id: uuid.UUID) -> None:
    assignment = session.get(StudentAssignment, assignment_id)
    if assignment:
        session.delete(assignment)
        session.commit()


def is_user_assigned_to_student(
    *, session: Session, user_id: uuid.UUID, student_id: uuid.UUID
) -> bool:
    statement = select(StudentAssignment).where(
        StudentAssignment.user_id == user_id,
        StudentAssignment.student_id == student_id,
    )
    return session.exec(statement).first() is not None


# =============================================================================
# SURVEY QUESTION CRUD
# =============================================================================


def create_question(
    *, session: Session, question_in: SurveyQuestionCreate
) -> SurveyQuestion:
    db_question = SurveyQuestion.model_validate(question_in)
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


def get_question(*, session: Session, question_id: uuid.UUID) -> SurveyQuestion | None:
    return session.get(SurveyQuestion, question_id)


def get_questions(
    *,
    session: Session,
    category: SurveyCategory | None = None,
    phase: QuestionPhase | None = None,
    is_active: bool | None = True,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[SurveyQuestion], int]:
    statement = select(SurveyQuestion)

    if category:
        statement = statement.where(SurveyQuestion.category == category)
    if phase:
        statement = statement.where(SurveyQuestion.phase == phase)
    if is_active is not None:
        statement = statement.where(SurveyQuestion.is_active == is_active)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit).order_by(SurveyQuestion.order)
    questions = list(session.exec(statement).all())
    return questions, count


def get_questions_for_student(
    *, session: Session, student_phase: StudentPhase
) -> list[SurveyQuestion]:
    """Get active questions applicable to a student's phase"""
    statement = (
        select(SurveyQuestion)
        .where(SurveyQuestion.is_active == True)
        .where(
            (SurveyQuestion.phase == QuestionPhase.ALL)
            | (SurveyQuestion.phase == student_phase.value)
        )
        .order_by(SurveyQuestion.order)
    )
    return list(session.exec(statement).all())


def update_question(
    *, session: Session, db_question: SurveyQuestion, question_in: SurveyQuestionUpdate
) -> SurveyQuestion:
    question_data = question_in.model_dump(exclude_unset=True)
    db_question.sqlmodel_update(question_data)
    session.add(db_question)
    session.commit()
    session.refresh(db_question)
    return db_question


def delete_question(*, session: Session, db_question: SurveyQuestion) -> None:
    session.delete(db_question)
    session.commit()


def reorder_questions(*, session: Session, question_ids: list[uuid.UUID]) -> None:
    """Reorder questions based on the provided list of IDs"""
    for index, question_id in enumerate(question_ids):
        question = session.get(SurveyQuestion, question_id)
        if question:
            question.order = index
            session.add(question)
    session.commit()


# =============================================================================
# SURVEY SESSION CRUD
# =============================================================================


def create_survey_session(
    *,
    session: Session,
    student_id: uuid.UUID,
    week_number: int,
    year: int,
    token_expiry_days: int = 4,
) -> SurveySession:
    """Create a new survey session for a student"""
    db_session = SurveySession(
        student_id=student_id,
        week_number=week_number,
        year=year,
        token_expires_at=datetime.utcnow() + timedelta(days=token_expiry_days),
    )
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


def get_survey_session(
    *, session: Session, session_id: uuid.UUID
) -> SurveySession | None:
    return session.get(SurveySession, session_id)


def get_survey_session_by_token(*, session: Session, token: str) -> SurveySession | None:
    statement = select(SurveySession).where(SurveySession.token == token)
    return session.exec(statement).first()


def get_student_sessions(
    *,
    session: Session,
    student_id: uuid.UUID,
    limit: int = 10,
) -> list[SurveySession]:
    """Get recent survey sessions for a student"""
    statement = (
        select(SurveySession)
        .where(SurveySession.student_id == student_id)
        .order_by(SurveySession.year.desc(), SurveySession.week_number.desc())
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_pending_sessions(*, session: Session) -> list[SurveySession]:
    """Get all pending sessions that haven't expired"""
    statement = select(SurveySession).where(
        SurveySession.status == SessionStatus.PENDING,
        SurveySession.token_expires_at > datetime.utcnow(),
    )
    return list(session.exec(statement).all())


def get_expired_sessions(*, session: Session) -> list[SurveySession]:
    """Get sessions that have expired but not yet marked"""
    statement = select(SurveySession).where(
        SurveySession.status.in_([SessionStatus.PENDING, SessionStatus.IN_PROGRESS]),
        SurveySession.token_expires_at <= datetime.utcnow(),
    )
    return list(session.exec(statement).all())


def update_session_status(
    *, session: Session, db_session: SurveySession, status: SessionStatus
) -> SurveySession:
    db_session.status = status
    if status == SessionStatus.COMPLETED:
        db_session.completed_at = datetime.utcnow()
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


def increment_reminder_count(
    *, session: Session, db_session: SurveySession
) -> SurveySession:
    db_session.reminder_count += 1
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session


# =============================================================================
# SURVEY RESPONSE CRUD
# =============================================================================


def create_response(
    *,
    session: Session,
    session_id: uuid.UUID,
    response_in: SurveyResponseCreate,
) -> SurveyResponse:
    db_response = SurveyResponse(
        session_id=session_id,
        question_id=response_in.question_id,
        answer=response_in.answer,
    )
    session.add(db_response)
    session.commit()
    session.refresh(db_response)
    return db_response


def create_responses_bulk(
    *,
    session: Session,
    session_id: uuid.UUID,
    responses: list[SurveyResponseCreate],
) -> list[SurveyResponse]:
    """Create multiple responses at once"""
    db_responses = []
    for response_in in responses:
        db_response = SurveyResponse(
            session_id=session_id,
            question_id=response_in.question_id,
            answer=response_in.answer,
        )
        session.add(db_response)
        db_responses.append(db_response)
    session.commit()
    for r in db_responses:
        session.refresh(r)
    return db_responses


def get_session_responses(
    *, session: Session, session_id: uuid.UUID
) -> list[SurveyResponse]:
    statement = select(SurveyResponse).where(SurveyResponse.session_id == session_id)
    return list(session.exec(statement).all())


# =============================================================================
# SCORE CRUD
# =============================================================================


def create_score(
    *,
    session: Session,
    student_id: uuid.UUID,
    session_id: uuid.UUID,
    category: SurveyCategory | None,
    score_value: float,
    color: ScoreColor,
    is_total: bool = False,
) -> Score:
    db_score = Score(
        student_id=student_id,
        session_id=session_id,
        category=category,
        score_value=score_value,
        color=color,
        is_total=is_total,
    )
    session.add(db_score)
    session.commit()
    session.refresh(db_score)
    return db_score


def get_student_scores(
    *,
    session: Session,
    student_id: uuid.UUID,
    limit: int = 10,
) -> list[Score]:
    """Get recent scores for a student"""
    statement = (
        select(Score)
        .where(Score.student_id == student_id)
        .order_by(Score.calculated_at.desc())
        .limit(limit)
    )
    return list(session.exec(statement).all())


def get_student_latest_total_score(
    *, session: Session, student_id: uuid.UUID
) -> Score | None:
    """Get the most recent total score for a student"""
    statement = (
        select(Score)
        .where(Score.student_id == student_id, Score.is_total == True)
        .order_by(Score.calculated_at.desc())
        .limit(1)
    )
    return session.exec(statement).first()


def get_session_scores(*, session: Session, session_id: uuid.UUID) -> list[Score]:
    statement = select(Score).where(Score.session_id == session_id)
    return list(session.exec(statement).all())


# =============================================================================
# INTERVENTION CRUD
# =============================================================================


def create_intervention(
    *,
    session: Session,
    intervention_in: InterventionCreate,
    user_id: uuid.UUID,
) -> Intervention:
    db_intervention = Intervention(
        student_id=intervention_in.student_id,
        user_id=user_id,
        status=intervention_in.status,
        comment=intervention_in.comment,
    )
    session.add(db_intervention)
    session.commit()
    session.refresh(db_intervention)
    return db_intervention


def get_intervention(
    *, session: Session, intervention_id: uuid.UUID
) -> Intervention | None:
    return session.get(Intervention, intervention_id)


def get_student_interventions(
    *,
    session: Session,
    student_id: uuid.UUID,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Intervention], int]:
    statement = select(Intervention).where(Intervention.student_id == student_id)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit).order_by(Intervention.created_at.desc())
    interventions = list(session.exec(statement).all())
    return interventions, count


# =============================================================================
# NOTIFICATION CRUD
# =============================================================================


def create_notification(
    *, session: Session, notification_in: NotificationCreate
) -> Notification:
    db_notification = Notification.model_validate(notification_in)
    session.add(db_notification)
    session.commit()
    session.refresh(db_notification)
    return db_notification


def get_notification(
    *, session: Session, notification_id: uuid.UUID
) -> Notification | None:
    return session.get(Notification, notification_id)


def get_user_notifications(
    *,
    session: Session,
    user_id: uuid.UUID,
    unread_only: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Notification], int]:
    statement = select(Notification).where(Notification.user_id == user_id)

    if unread_only:
        statement = statement.where(Notification.read_at == None)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit).order_by(Notification.sent_at.desc())
    notifications = list(session.exec(statement).all())
    return notifications, count


def mark_notification_read(
    *, session: Session, db_notification: Notification
) -> Notification:
    db_notification.read_at = datetime.utcnow()
    session.add(db_notification)
    session.commit()
    session.refresh(db_notification)
    return db_notification


def get_unread_notification_count(*, session: Session, user_id: uuid.UUID) -> int:
    statement = select(func.count()).where(
        Notification.user_id == user_id,
        Notification.read_at == None,
    )
    return session.exec(statement).one()


# =============================================================================
# AUDIT LOG CRUD
# =============================================================================


def create_audit_log(*, session: Session, audit_in: AuditLogCreate) -> AuditLog:
    db_audit = AuditLog.model_validate(audit_in)
    session.add(db_audit)
    session.commit()
    session.refresh(db_audit)
    return db_audit


def get_audit_logs(
    *,
    session: Session,
    user_id: uuid.UUID | None = None,
    entity_type: str | None = None,
    entity_id: uuid.UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> tuple[list[AuditLog], int]:
    statement = select(AuditLog)

    if user_id:
        statement = statement.where(AuditLog.user_id == user_id)
    if entity_type:
        statement = statement.where(AuditLog.entity_type == entity_type)
    if entity_id:
        statement = statement.where(AuditLog.entity_id == entity_id)

    count_statement = select(func.count()).select_from(statement.subquery())
    count = session.exec(count_statement).one()

    statement = statement.offset(skip).limit(limit).order_by(AuditLog.created_at.desc())
    logs = list(session.exec(statement).all())
    return logs, count


# =============================================================================
# DASHBOARD HELPERS
# =============================================================================


def get_students_with_latest_scores(
    *,
    session: Session,
    user_id: uuid.UUID | None = None,
) -> list[tuple[Student, Score | None]]:
    """
    Get all students (or assigned students if user_id provided) with their latest total score
    """
    if user_id:
        # Get students assigned to this user
        student_statement = (
            select(Student)
            .join(StudentAssignment, Student.id == StudentAssignment.student_id)
            .where(StudentAssignment.user_id == user_id)
            .where(Student.status == StudentStatus.ACTIVE)
        )
    else:
        student_statement = select(Student).where(Student.status == StudentStatus.ACTIVE)

    students = list(session.exec(student_statement).all())

    result = []
    for student in students:
        latest_score = get_student_latest_total_score(session=session, student_id=student.id)
        result.append((student, latest_score))

    return result


def get_high_risk_students(
    *,
    session: Session,
    user_id: uuid.UUID | None = None,
) -> list[tuple[Student, Score]]:
    """
    Get students with red scores (high risk)
    """
    students_with_scores = get_students_with_latest_scores(session=session, user_id=user_id)
    return [
        (student, score)
        for student, score in students_with_scores
        if score and score.color == ScoreColor.RED
    ]
