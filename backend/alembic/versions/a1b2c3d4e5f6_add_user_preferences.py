"""add_user_preferences

Revision ID: a1b2c3d4e5f6
Revises: 6e390f037587
Create Date: 2026-03-04 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "6e390f037587"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add arrival_buffer and walking_speed columns to users table."""
    op.add_column(
        "users",
        sa.Column("arrival_buffer", sa.Integer(), nullable=True, server_default="10"),
    )
    op.add_column(
        "users",
        sa.Column("walking_speed", sa.Integer(), nullable=True, server_default="2"),
    )


def downgrade() -> None:
    """Remove arrival_buffer and walking_speed columns from users table."""
    op.drop_column("users", "walking_speed")
    op.drop_column("users", "arrival_buffer")
