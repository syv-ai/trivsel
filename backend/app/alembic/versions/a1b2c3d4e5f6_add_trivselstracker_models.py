"""Add TrivselsTracker models

Revision ID: a1b2c3d4e5f6
Revises: 1a31ce608336
Create Date: 2025-12-11 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "1a31ce608336"
branch_labels = None
depends_on = None


def upgrade():
    # Create enums
    staffrole_enum = postgresql.ENUM(
        "mentor", "fact_team", "admin", "analyst", name="staffrole", create_type=False
    )
    staffrole_enum.create(op.get_bind(), checkfirst=True)

    studentphase_enum = postgresql.ENUM(
        "indslusning", "hovedforloeb", "udslusning", name="studentphase", create_type=False
    )
    studentphase_enum.create(op.get_bind(), checkfirst=True)

    studentstatus_enum = postgresql.ENUM(
        "active", "inactive", name="studentstatus", create_type=False
    )
    studentstatus_enum.create(op.get_bind(), checkfirst=True)

    assignmentrole_enum = postgresql.ENUM(
        "primary_mentor", "team_member", name="assignmentrole", create_type=False
    )
    assignmentrole_enum.create(op.get_bind(), checkfirst=True)

    surveycategory_enum = postgresql.ENUM(
        "trivsel", "motivation", "faellesskab", "selvindsigt", "arbejdsparathed",
        name="surveycategory", create_type=False
    )
    surveycategory_enum.create(op.get_bind(), checkfirst=True)

    questionphase_enum = postgresql.ENUM(
        "all", "indslusning", "hovedforloeb", "udslusning", name="questionphase", create_type=False
    )
    questionphase_enum.create(op.get_bind(), checkfirst=True)

    sessionstatus_enum = postgresql.ENUM(
        "pending", "in_progress", "completed", "expired", "non_response",
        name="sessionstatus", create_type=False
    )
    sessionstatus_enum.create(op.get_bind(), checkfirst=True)

    scorecolor_enum = postgresql.ENUM(
        "green", "yellow", "red", name="scorecolor", create_type=False
    )
    scorecolor_enum.create(op.get_bind(), checkfirst=True)

    interventionstatus_enum = postgresql.ENUM(
        "contacted", "meeting_planned", "intervention_started", "completed",
        name="interventionstatus", create_type=False
    )
    interventionstatus_enum.create(op.get_bind(), checkfirst=True)

    notificationtype_enum = postgresql.ENUM(
        "critical_score", "score_drop", "non_response", "weekly_summary",
        name="notificationtype", create_type=False
    )
    notificationtype_enum.create(op.get_bind(), checkfirst=True)

    # Add new columns to user table
    op.add_column("user", sa.Column("role", postgresql.ENUM("mentor", "fact_team", "admin", "analyst", name="staffrole", create_type=False), nullable=True))
    op.add_column("user", sa.Column("phone_number", sa.String(length=20), nullable=True))

    # Create student table
    op.create_table(
        "student",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("internal_id", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phase", postgresql.ENUM("indslusning", "hovedforloeb", "udslusning", name="studentphase", create_type=False), nullable=False),
        sa.Column("consent_status", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("consent_date", sa.DateTime(), nullable=True),
        sa.Column("status", postgresql.ENUM("active", "inactive", name="studentstatus", create_type=False), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("internal_id"),
    )
    op.create_index("ix_student_internal_id", "student", ["internal_id"], unique=True)
    op.create_index("ix_student_email", "student", ["email"], unique=False)

    # Create group table
    op.create_table(
        "group",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create studentassignment table
    op.create_table(
        "studentassignment",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("student_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", postgresql.ENUM("primary_mentor", "team_member", name="assignmentrole", create_type=False), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["student_id"], ["student.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create groupmembership table
    op.create_table(
        "groupmembership",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("student_id", sa.UUID(), nullable=False),
        sa.Column("group_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["student_id"], ["student.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["group_id"], ["group.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create surveyquestion table
    op.create_table(
        "surveyquestion",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("category", postgresql.ENUM("trivsel", "motivation", "faellesskab", "selvindsigt", "arbejdsparathed", name="surveycategory", create_type=False), nullable=False),
        sa.Column("phase", postgresql.ENUM("all", "indslusning", "hovedforloeb", "udslusning", name="questionphase", create_type=False), nullable=False, server_default="all"),
        sa.Column("question_text_da", sa.String(length=500), nullable=False),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create surveysession table
    op.create_table(
        "surveysession",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("student_id", sa.UUID(), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("token_expires_at", sa.DateTime(), nullable=False),
        sa.Column("status", postgresql.ENUM("pending", "in_progress", "completed", "expired", "non_response", name="sessionstatus", create_type=False), nullable=False, server_default="pending"),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("reminder_count", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["student_id"], ["student.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index("ix_surveysession_token", "surveysession", ["token"], unique=True)

    # Create surveyresponse table
    op.create_table(
        "surveyresponse",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("question_id", sa.UUID(), nullable=False),
        sa.Column("answer", sa.Integer(), nullable=False),
        sa.Column("answered_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["session_id"], ["surveysession.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["question_id"], ["surveyquestion.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create score table
    op.create_table(
        "score",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("student_id", sa.UUID(), nullable=False),
        sa.Column("session_id", sa.UUID(), nullable=False),
        sa.Column("category", postgresql.ENUM("trivsel", "motivation", "faellesskab", "selvindsigt", "arbejdsparathed", name="surveycategory", create_type=False), nullable=True),
        sa.Column("score_value", sa.Float(), nullable=False),
        sa.Column("color", postgresql.ENUM("green", "yellow", "red", name="scorecolor", create_type=False), nullable=False),
        sa.Column("is_total", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("calculated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["student_id"], ["student.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["session_id"], ["surveysession.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create intervention table
    op.create_table(
        "intervention",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("student_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("status", postgresql.ENUM("contacted", "meeting_planned", "intervention_started", "completed", name="interventionstatus", create_type=False), nullable=False),
        sa.Column("comment", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["student_id"], ["student.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create notification table
    op.create_table(
        "notification",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("student_id", sa.UUID(), nullable=True),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("type", postgresql.ENUM("critical_score", "score_drop", "non_response", "weekly_summary", name="notificationtype", create_type=False), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.String(length=1000), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["student_id"], ["student.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create auditlog table
    op.create_table(
        "auditlog",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("entity_id", sa.UUID(), nullable=True),
        sa.Column("details", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Drop item table (no longer needed)
    op.drop_table("item")


def downgrade():
    # Recreate item table
    op.create_table(
        "item",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("owner_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Drop all new tables
    op.drop_table("auditlog")
    op.drop_table("notification")
    op.drop_table("intervention")
    op.drop_table("score")
    op.drop_table("surveyresponse")
    op.drop_table("surveysession")
    op.drop_table("surveyquestion")
    op.drop_table("groupmembership")
    op.drop_table("studentassignment")
    op.drop_table("group")
    op.drop_index("ix_student_email", table_name="student")
    op.drop_index("ix_student_internal_id", table_name="student")
    op.drop_table("student")

    # Remove new columns from user table
    op.drop_column("user", "phone_number")
    op.drop_column("user", "role")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS interventionstatus")
    op.execute("DROP TYPE IF EXISTS scorecolor")
    op.execute("DROP TYPE IF EXISTS sessionstatus")
    op.execute("DROP TYPE IF EXISTS questionphase")
    op.execute("DROP TYPE IF EXISTS surveycategory")
    op.execute("DROP TYPE IF EXISTS assignmentrole")
    op.execute("DROP TYPE IF EXISTS studentstatus")
    op.execute("DROP TYPE IF EXISTS studentphase")
    op.execute("DROP TYPE IF EXISTS staffrole")
