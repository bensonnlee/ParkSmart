"""add_academic_calendar

Revision ID: 9b62b05092d8
Revises: 47d18384b161
Create Date: 2026-03-28 12:11:38.985767

"""
from datetime import date, timedelta
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9b62b05092d8'
down_revision: Union[str, Sequence[str], None] = '47d18384b161'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- academic_terms ---
    op.create_table(
        'academic_terms',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('term_type', sa.String(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("term_type IN ('fall', 'winter', 'spring')", name='ck_academic_terms_term_type'),
        sa.CheckConstraint("EXTRACT(DOW FROM start_date) = 0", name='ck_academic_terms_start_date_sunday'),
    )
    op.execute(
        "CREATE UNIQUE INDEX uq_academic_terms_type_year "
        "ON academic_terms (term_type, EXTRACT(YEAR FROM start_date))"
    )

    # --- academic_weeks ---
    op.create_table(
        'academic_weeks',
        sa.Column('id', sa.UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('term_id', sa.UUID(), nullable=False),
        sa.Column('week_number', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('label', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['term_id'], ['academic_terms.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('term_id', 'week_number', name='uq_academic_weeks_term_week'),
        sa.CheckConstraint('week_number BETWEEN 1 AND 11', name='ck_academic_weeks_week_number'),
        sa.CheckConstraint('end_date = start_date + 6', name='ck_academic_weeks_end_date'),
    )
    op.create_index('idx_academic_weeks_dates', 'academic_weeks', ['start_date', 'end_date'])

    # --- is_admin on users ---
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default='false', nullable=False))

    # --- Seed data ---
    # 1. Set admin user
    op.execute("UPDATE users SET is_admin = true WHERE email = 'blee300@ucr.edu'")

    # 2. Seed Winter 2026 term (start_date = 2026-01-04, a Sunday)
    term_id = str(uuid4())
    op.execute(
        f"INSERT INTO academic_terms (id, name, term_type, start_date) "
        f"VALUES ('{term_id}'::uuid, 'Winter 2026', 'winter', '2026-01-04')"
    )

    # Generate 11 weeks
    start = date(2026, 1, 4)
    for i in range(11):
        week_start = start + timedelta(weeks=i)
        week_end = week_start + timedelta(days=6)
        week_id = str(uuid4())
        op.execute(
            f"INSERT INTO academic_weeks (id, term_id, week_number, start_date, end_date) "
            f"VALUES ('{week_id}'::uuid, '{term_id}'::uuid, {i + 1}, "
            f"'{week_start.isoformat()}', '{week_end.isoformat()}')"
        )


def downgrade() -> None:
    op.drop_index('idx_academic_weeks_dates', table_name='academic_weeks')
    op.drop_table('academic_weeks')
    op.drop_index('uq_academic_terms_type_year', table_name='academic_terms')
    op.drop_table('academic_terms')
    op.drop_column('users', 'is_admin')
