"""Add custom questions support

Revision ID: c3d4e5f6g7h8
Revises: b2c3d4e5f6g7
Create Date: 2025-02-04 12:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "c3d4e5f6g7h8"
down_revision = "b2c3d4e5f6g7"
branch_labels = None
depends_on = None


def upgrade():
    # Add custom_questions column to surveysession table
    op.add_column(
        "surveysession",
        sa.Column("custom_questions", postgresql.JSON(astext_type=sa.Text()), nullable=True),
    )

    # Make question_id nullable in surveyresponse table
    op.alter_column(
        "surveyresponse",
        "question_id",
        existing_type=sa.UUID(),
        nullable=True,
    )

    # Add custom_question_index column to surveyresponse table
    op.add_column(
        "surveyresponse",
        sa.Column("custom_question_index", sa.Integer(), nullable=True),
    )


def downgrade():
    # Remove custom_question_index column from surveyresponse table
    op.drop_column("surveyresponse", "custom_question_index")

    # Make question_id non-nullable again (this will fail if there are custom responses)
    op.alter_column(
        "surveyresponse",
        "question_id",
        existing_type=sa.UUID(),
        nullable=False,
    )

    # Remove custom_questions column from surveysession table
    op.drop_column("surveysession", "custom_questions")
