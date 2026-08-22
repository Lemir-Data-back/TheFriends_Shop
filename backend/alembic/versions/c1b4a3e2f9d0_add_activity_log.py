"""add activity log table

Revision ID: c1b4a3e2f9d0
Revises: f152a2d9d93a
Create Date: 2026-07-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c1b4a3e2f9d0'
down_revision: Union[str, None] = 'f152a2d9d93a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'activity_logs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(length=64), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('details', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_activity_logs_id', 'activity_logs', ['id'])
    op.create_index('ix_activity_logs_user_id', 'activity_logs', ['user_id'])
    op.create_index('ix_activity_logs_action', 'activity_logs', ['action'])
    op.create_index('ix_activity_logs_created_at', 'activity_logs', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_activity_logs_created_at', 'activity_logs')
    op.drop_index('ix_activity_logs_action', 'activity_logs')
    op.drop_index('ix_activity_logs_user_id', 'activity_logs')
    op.drop_index('ix_activity_logs_id', 'activity_logs')
    op.drop_table('activity_logs')
