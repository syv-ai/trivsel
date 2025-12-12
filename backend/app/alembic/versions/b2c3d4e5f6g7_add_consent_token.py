"""Add consent_token to student

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2025-12-12 11:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "b2c3d4e5f6g7"
down_revision = "a1b2c3d4e5f6"
branch_labels = None
depends_on = None


def upgrade():
    # Add consent_token column to student table
    op.add_column(
        "student",
        sa.Column("consent_token", sa.String(length=64), nullable=True)
    )
    op.create_index("ix_student_consent_token", "student", ["consent_token"], unique=False)


def downgrade():
    op.drop_index("ix_student_consent_token", table_name="student")
    op.drop_column("student", "consent_token")
