"""Add RiskProfileModel

Revision ID: d2b3c4d5e6f7
Revises: c1a2b3d4e5f6
Create Date: 2026-08-22 11:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'd2b3c4d5e6f7'
down_revision: Union[str, Sequence[str], None] = 'c1a2b3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'risk_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('risk_tolerance_score', sa.Float(), nullable=False),
        sa.Column('risk_capacity_score', sa.Float(), nullable=False),
        sa.Column('overall_score', sa.Float(), nullable=False),
        sa.Column('risk_category', sa.String(), nullable=False),
        sa.Column('investment_horizon_years', sa.Float(), nullable=False),
        sa.Column('questionnaire_version', sa.String(), nullable=False, server_default='v1'),
        sa.Column('responses', sa.JSON(), nullable=False),
        sa.Column('factors', sa.JSON(), nullable=False),
        sa.Column('narrative', sa.String(), nullable=False),
        sa.Column('recommended_allocation', sa.JSON(), nullable=False),
        sa.Column('goal_assessments', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_risk_profiles_id'), 'risk_profiles', ['id'], unique=False)
    op.create_index(op.f('ix_risk_profiles_user_id'), 'risk_profiles', ['user_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_risk_profiles_user_id'), table_name='risk_profiles')
    op.drop_index(op.f('ix_risk_profiles_id'), table_name='risk_profiles')
    op.drop_table('risk_profiles')
