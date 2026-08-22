"""Add user auth fields

Revision ID: c1a2b3d4e5f6
Revises: ba4584e14ed2
Create Date: 2026-08-22 10:55:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ba4584e14ed2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    indexes = [idx['name'] for idx in inspector.get_indexes('users')]

    with op.batch_alter_table('users', schema=None) as batch_op:
        if 'email' not in columns:
            batch_op.add_column(sa.Column('email', sa.String(), nullable=True))
        if 'hashed_password' not in columns:
            batch_op.add_column(sa.Column('hashed_password', sa.String(), nullable=True))
        if 'google_id' not in columns:
            batch_op.add_column(sa.Column('google_id', sa.String(), nullable=True))
        if 'avatar_url' not in columns:
            batch_op.add_column(sa.Column('avatar_url', sa.String(), nullable=True))
        if 'is_active' not in columns:
            batch_op.add_column(sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False))
        
        if 'ix_users_email' not in indexes:
            batch_op.create_index(batch_op.f('ix_users_email'), ['email'], unique=True)
        if 'ix_users_google_id' not in indexes:
            batch_op.create_index(batch_op.f('ix_users_google_id'), ['google_id'], unique=True)


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        try:
            batch_op.drop_index(batch_op.f('ix_users_google_id'))
        except Exception:
            pass
        try:
            batch_op.drop_index(batch_op.f('ix_users_email'))
        except Exception:
            pass
        for col in ('is_active', 'avatar_url', 'google_id', 'hashed_password', 'email'):
            try:
                batch_op.drop_column(col)
            except Exception:
                pass
