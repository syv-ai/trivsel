import uuid
from datetime import datetime
from enum import Enum

from pydantic import EmailStr
from sqlmodel import JSON, Column, Field, Relationship, SQLModel


# =============================================================================
# ENUMS
# =============================================================================


class StaffRole(str, Enum):
    """Role types for staff users"""

    MENTOR = "mentor"
    FACT_TEAM = "fact_team"
    ADMIN = "admin"
    ANALYST = "analyst"


class StudentPhase(str, Enum):
    """Student phases in the program"""

    INDSLUSNING = "indslusning"  # Intake/onboarding
    HOVEDFORLOEB = "hovedforloeb"  # Main program
    UDSLUSNING = "udslusning"  # Exit/completion


class StudentStatus(str, Enum):
    """Student activity status"""

    ACTIVE = "active"
    INACTIVE = "inactive"


class AssignmentRole(str, Enum):
    """Role in student-staff assignment"""

    PRIMARY_MENTOR = "primary_mentor"
    TEAM_MEMBER = "team_member"


class SurveyCategory(str, Enum):
    """Categories for survey questions"""

    TRIVSEL = "trivsel"  # Wellbeing
    MOTIVATION = "motivation"  # Motivation
    FAELLESSKAB = "faellesskab"  # Community/belonging
    SELVINDSIGT = "selvindsigt"  # Self-insight
    ARBEJDSPARATHED = "arbejdsparathed"  # Work readiness


class QuestionPhase(str, Enum):
    """Which student phases a question applies to"""

    ALL = "all"
    INDSLUSNING = "indslusning"
    HOVEDFORLOEB = "hovedforloeb"
    UDSLUSNING = "udslusning"


class SessionStatus(str, Enum):
    """Status of a survey session"""

    PENDING = "pending"  # Sent but not started
    IN_PROGRESS = "in_progress"  # Started but not completed
    COMPLETED = "completed"  # Successfully completed
    EXPIRED = "expired"  # Token expired without completion
    NON_RESPONSE = "non_response"  # Marked as non-response


class ScoreColor(str, Enum):
    """Traffic light colors for scores"""

    GREEN = "green"  # 4.0-5.0
    YELLOW = "yellow"  # 3.0-3.9
    RED = "red"  # 1.0-2.9


class InterventionStatus(str, Enum):
    """Status of an intervention"""

    CONTACTED = "contacted"
    MEETING_PLANNED = "meeting_planned"
    INTERVENTION_STARTED = "intervention_started"
    COMPLETED = "completed"


class NotificationType(str, Enum):
    """Types of notifications"""

    CRITICAL_SCORE = "critical_score"
    SCORE_DROP = "score_drop"
    NON_RESPONSE = "non_response"
    WEEKLY_SUMMARY = "weekly_summary"


# =============================================================================
# USER MODELS (Extended)
# =============================================================================


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)
    # New fields for TrivselsTracker
    role: StaffRole | None = Field(default=None)
    phone_number: str | None = Field(default=None, max_length=20)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    # Relationships
    assignments: list["StudentAssignment"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    interventions: list["Intervention"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    notifications: list["Notification"] = Relationship(
        back_populates="user", cascade_delete=True
    )
    audit_logs: list["AuditLog"] = Relationship(
        back_populates="user", cascade_delete=True
    )


class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# =============================================================================
# STUDENT MODELS
# =============================================================================


class StudentBase(SQLModel):
    name: str = Field(max_length=255)
    email: EmailStr = Field(max_length=255, index=True)
    phase: StudentPhase = Field(default=StudentPhase.INDSLUSNING)
    consent_status: bool = Field(default=False)
    status: StudentStatus = Field(default=StudentStatus.ACTIVE)


class StudentCreate(StudentBase):
    pass


class StudentUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    phase: StudentPhase | None = None
    consent_status: bool | None = None
    status: StudentStatus | None = None


class Student(StudentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    internal_id: str = Field(
        default_factory=lambda: f"STU-{uuid.uuid4().hex[:8].upper()}",
        max_length=20,
        unique=True,
        index=True,
    )
    consent_date: datetime | None = Field(default=None)
    consent_token: str | None = Field(
        default=None,
        max_length=64,
        index=True,
        description="Token for opt-out consent link",
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    assignments: list["StudentAssignment"] = Relationship(
        back_populates="student", cascade_delete=True
    )
    group_memberships: list["GroupMembership"] = Relationship(
        back_populates="student", cascade_delete=True
    )
    survey_sessions: list["SurveySession"] = Relationship(
        back_populates="student", cascade_delete=True
    )
    scores: list["Score"] = Relationship(back_populates="student", cascade_delete=True)
    interventions: list["Intervention"] = Relationship(
        back_populates="student", cascade_delete=True
    )
    notifications: list["Notification"] = Relationship(
        back_populates="student", cascade_delete=True
    )


class StudentPublic(StudentBase):
    id: uuid.UUID
    internal_id: str
    consent_date: datetime | None
    created_at: datetime


class StudentsPublic(SQLModel):
    data: list[StudentPublic]
    count: int


class StudentWithLatestScore(StudentPublic):
    """Student with their latest score for dashboard display"""

    latest_score: float | None = None
    latest_color: ScoreColor | None = None
    last_response_date: datetime | None = None


# =============================================================================
# GROUP MODELS
# =============================================================================


class GroupBase(SQLModel):
    name: str = Field(max_length=255)
    description: str | None = Field(default=None, max_length=500)


class GroupCreate(GroupBase):
    pass


class GroupUpdate(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=500)


class Group(GroupBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    memberships: list["GroupMembership"] = Relationship(
        back_populates="group", cascade_delete=True
    )


class GroupPublic(GroupBase):
    id: uuid.UUID
    created_at: datetime


class GroupsPublic(SQLModel):
    data: list[GroupPublic]
    count: int


# =============================================================================
# STUDENT ASSIGNMENT MODELS (Student-Staff relationship)
# =============================================================================


class StudentAssignmentBase(SQLModel):
    role: AssignmentRole = Field(default=AssignmentRole.TEAM_MEMBER)


class StudentAssignmentCreate(StudentAssignmentBase):
    student_id: uuid.UUID
    user_id: uuid.UUID


class StudentAssignment(StudentAssignmentBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="student.id", ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    student: Student = Relationship(back_populates="assignments")
    user: User = Relationship(back_populates="assignments")


class StudentAssignmentPublic(StudentAssignmentBase):
    id: uuid.UUID
    student_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


# =============================================================================
# GROUP MEMBERSHIP MODELS
# =============================================================================


class GroupMembershipCreate(SQLModel):
    student_id: uuid.UUID
    group_id: uuid.UUID


class GroupMembership(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="student.id", ondelete="CASCADE")
    group_id: uuid.UUID = Field(foreign_key="group.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    student: Student = Relationship(back_populates="group_memberships")
    group: Group = Relationship(back_populates="memberships")


# =============================================================================
# SURVEY QUESTION MODELS
# =============================================================================


class SurveyQuestionBase(SQLModel):
    category: SurveyCategory
    phase: QuestionPhase = Field(default=QuestionPhase.ALL)
    question_text_da: str = Field(max_length=500)
    order: int = Field(default=0)
    is_active: bool = Field(default=True)


class SurveyQuestionCreate(SurveyQuestionBase):
    pass


class SurveyQuestionUpdate(SQLModel):
    category: SurveyCategory | None = None
    phase: QuestionPhase | None = None
    question_text_da: str | None = Field(default=None, max_length=500)
    order: int | None = None
    is_active: bool | None = None


class SurveyQuestion(SurveyQuestionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    responses: list["SurveyResponse"] = Relationship(
        back_populates="question", cascade_delete=True
    )


class SurveyQuestionPublic(SurveyQuestionBase):
    id: uuid.UUID
    created_at: datetime


class SurveyQuestionsPublic(SQLModel):
    data: list[SurveyQuestionPublic]
    count: int


class QuestionReorder(SQLModel):
    """Request to reorder questions"""

    question_ids: list[uuid.UUID]


# =============================================================================
# SURVEY SESSION MODELS
# =============================================================================


class SurveySessionBase(SQLModel):
    week_number: int
    year: int


class SurveySessionCreate(SurveySessionBase):
    student_id: uuid.UUID


class SurveySession(SurveySessionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="student.id", ondelete="CASCADE")
    token: str = Field(
        default_factory=lambda: uuid.uuid4().hex, max_length=64, unique=True, index=True
    )
    token_expires_at: datetime
    status: SessionStatus = Field(default=SessionStatus.PENDING)
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = Field(default=None)
    reminder_count: int = Field(default=0)
    custom_questions: list[str] | None = Field(default=None, sa_column=Column(JSON))
    # Relationships
    student: Student = Relationship(back_populates="survey_sessions")
    responses: list["SurveyResponse"] = Relationship(
        back_populates="session", cascade_delete=True
    )
    scores: list["Score"] = Relationship(back_populates="session", cascade_delete=True)


class SurveySessionPublic(SurveySessionBase):
    id: uuid.UUID
    student_id: uuid.UUID
    token: str
    status: SessionStatus
    sent_at: datetime
    completed_at: datetime | None
    reminder_count: int


class SurveySessionsPublic(SQLModel):
    data: list[SurveySessionPublic]
    count: int


# =============================================================================
# SURVEY RESPONSE MODELS
# =============================================================================


class SurveyResponseBase(SQLModel):
    answer: int = Field(ge=1, le=5)


class SurveyResponseCreate(SurveyResponseBase):
    question_id: uuid.UUID


class CustomResponseCreate(SQLModel):
    """Create a response for a custom question"""

    custom_question_index: int = Field(ge=0, le=1)
    answer: int = Field(ge=1, le=5)


class SurveyResponseBulkCreate(SQLModel):
    """Bulk create survey responses"""

    responses: list[SurveyResponseCreate]
    custom_responses: list[CustomResponseCreate] | None = None


class SurveyResponse(SurveyResponseBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    session_id: uuid.UUID = Field(foreign_key="surveysession.id", ondelete="CASCADE")
    question_id: uuid.UUID | None = Field(
        default=None, foreign_key="surveyquestion.id", ondelete="CASCADE"
    )
    custom_question_index: int | None = Field(default=None, ge=0, le=1)
    answered_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    session: SurveySession = Relationship(back_populates="responses")
    question: SurveyQuestion | None = Relationship(back_populates="responses")


class SurveyResponsePublic(SurveyResponseBase):
    id: uuid.UUID
    session_id: uuid.UUID
    question_id: uuid.UUID | None
    custom_question_index: int | None
    answered_at: datetime


# =============================================================================
# CUSTOM QUESTION MODELS
# =============================================================================


class SendSurveyRequest(SQLModel):
    """Request body for sending a survey with optional custom questions"""

    custom_questions: list[str] | None = Field(default=None)


class CustomQuestionInfo(SQLModel):
    """Information about a custom question"""

    index: int
    question_text: str


# =============================================================================
# SCORE MODELS
# =============================================================================


class ScoreBase(SQLModel):
    category: SurveyCategory | None = None
    score_value: float = Field(ge=1.0, le=5.0)
    color: ScoreColor
    is_total: bool = Field(default=False)


class Score(ScoreBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="student.id", ondelete="CASCADE")
    session_id: uuid.UUID = Field(foreign_key="surveysession.id", ondelete="CASCADE")
    calculated_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    student: Student = Relationship(back_populates="scores")
    session: SurveySession = Relationship(back_populates="scores")


class ScorePublic(ScoreBase):
    id: uuid.UUID
    student_id: uuid.UUID
    session_id: uuid.UUID
    calculated_at: datetime


class ScoresPublic(SQLModel):
    data: list[ScorePublic]
    count: int


class ScoreHistory(SQLModel):
    """Score history for a student"""

    week_number: int
    year: int
    total_score: float
    total_color: ScoreColor
    category_scores: dict[str, float]
    completed_at: datetime


# =============================================================================
# INTERVENTION MODELS
# =============================================================================


class InterventionBase(SQLModel):
    status: InterventionStatus
    comment: str | None = Field(default=None, max_length=1000)


class InterventionCreate(InterventionBase):
    student_id: uuid.UUID


class Intervention(InterventionBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="student.id", ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    student: Student = Relationship(back_populates="interventions")
    user: User = Relationship(back_populates="interventions")


class InterventionPublic(InterventionBase):
    id: uuid.UUID
    student_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime


class InterventionsPublic(SQLModel):
    data: list[InterventionPublic]
    count: int


# =============================================================================
# NOTIFICATION MODELS
# =============================================================================


class NotificationBase(SQLModel):
    type: NotificationType
    title: str = Field(max_length=255)
    message: str = Field(max_length=1000)


class NotificationCreate(NotificationBase):
    student_id: uuid.UUID | None = None
    user_id: uuid.UUID


class Notification(NotificationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID | None = Field(
        default=None, foreign_key="student.id", ondelete="CASCADE"
    )
    user_id: uuid.UUID = Field(foreign_key="user.id", ondelete="CASCADE")
    sent_at: datetime = Field(default_factory=datetime.utcnow)
    read_at: datetime | None = Field(default=None)
    # Relationships
    student: Student | None = Relationship(back_populates="notifications")
    user: User = Relationship(back_populates="notifications")


class NotificationPublic(NotificationBase):
    id: uuid.UUID
    student_id: uuid.UUID | None
    user_id: uuid.UUID
    sent_at: datetime
    read_at: datetime | None


class NotificationsPublic(SQLModel):
    data: list[NotificationPublic]
    count: int


# =============================================================================
# AUDIT LOG MODELS
# =============================================================================


class AuditLogBase(SQLModel):
    action: str = Field(max_length=100)
    entity_type: str = Field(max_length=50)
    entity_id: uuid.UUID | None = None
    ip_address: str | None = Field(default=None, max_length=45)


class AuditLogCreate(AuditLogBase):
    user_id: uuid.UUID | None = None
    details: dict | None = None


class AuditLog(AuditLogBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID | None = Field(
        default=None, foreign_key="user.id", ondelete="SET NULL"
    )
    details: dict | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    # Relationships
    user: User | None = Relationship(back_populates="audit_logs")


class AuditLogPublic(AuditLogBase):
    id: uuid.UUID
    user_id: uuid.UUID | None
    details: dict | None
    created_at: datetime


# =============================================================================
# GENERIC MODELS
# =============================================================================


class Message(SQLModel):
    message: str


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# =============================================================================
# SURVEY PUBLIC RESPONSE MODELS (for student survey flow)
# =============================================================================


class SurveyInfo(SQLModel):
    """Information returned when accessing a survey by token"""

    student_name: str
    week_number: int
    year: int
    questions: list[SurveyQuestionPublic]
    custom_questions: list[CustomQuestionInfo] | None = None
    status: SessionStatus


class SurveySubmitResponse(SQLModel):
    """Response after submitting a survey"""

    message: str
    total_score: float
    color: ScoreColor


# =============================================================================
# DASHBOARD MODELS
# =============================================================================


class DashboardOverview(SQLModel):
    """Overview data for mentor dashboard"""

    total_students: int
    green_count: int
    yellow_count: int
    red_count: int
    non_response_count: int
    students: list[StudentWithLatestScore]


class AlertInfo(SQLModel):
    """Alert information for dashboard"""

    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    type: NotificationType
    title: str
    message: str
    sent_at: datetime
    read_at: datetime | None


class AlertsResponse(SQLModel):
    """Response containing alerts"""

    data: list[AlertInfo]
    count: int


# =============================================================================
# ANALYTICS MODELS
# =============================================================================


class AnalyticsExportRow(SQLModel):
    """Single row in analytics export"""

    internal_id: str
    week_number: int
    year: int
    phase: StudentPhase
    category: SurveyCategory | None
    score: float
    color: ScoreColor
    is_total: bool
    completed_at: datetime


class AnalyticsSummary(SQLModel):
    """Aggregated analytics summary"""

    total_students: int
    total_sessions: int
    total_responses: int
    response_rate: float
    average_score: float
    score_distribution: dict[str, int]  # green/yellow/red counts
