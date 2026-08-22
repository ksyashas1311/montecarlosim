"""Add user auth fields

Revision ID: c1a2b3d4e5f6
Revises: ba4584e14ed2
Create Date: 2026-08-22 10:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ba4584e14ed2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('email', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('hashed_password', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('google_id', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('avatar_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False))
        batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)
        batch_op.create_index(batch_op.f('ix_users_google_id'), ['google_id'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_users_google_id'))
        batch_op.drop_index(batch_op.f('ix_users_email'))
        batch_op.drop_column('is_active')
        batch_op.drop_column('avatar_url')
        batch_op.drop_column('google_id')
        batch_op.drop_column('hashed_password')
        batch_op.drop_column('email')
