"""Initial migration: Create core database tables

Revision ID: de427004e402
Revises: 
Create Date: 2026-08-22 08:38:50.855993

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector


# revision identifiers, used by Alembic.
revision: str = 'de427004e402'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    tables = inspector.get_table_names()

    # 1. users table
    if 'users' not in tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('hashed_password', sa.String(), nullable=True),
            sa.Column('google_id', sa.String(), nullable=True),
            sa.Column('name', sa.String(), nullable=True),
            sa.Column('avatar_url', sa.String(), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
        )
        op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
        op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
        op.create_index(op.f('ix_users_google_id'), 'users', ['google_id'], unique=True)
        op.create_index(op.f('ix_users_name'), 'users', ['name'], unique=False)

    # 2. user_profiles table
    if 'user_profiles' not in tables:
        op.create_table(
            'user_profiles',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=True),
            sa.Column('current_age', sa.Integer(), nullable=False),
            sa.Column('monthly_income', sa.Float(), nullable=False),
            sa.Column('monthly_expenses', sa.Float(), nullable=False),
            sa.Column('monthly_sip', sa.Float(), nullable=False),
            sa.Column('current_wealth', sa.Float(), nullable=False),
            sa.Column('retirement_age', sa.Integer(), server_default='55', nullable=True),
            sa.Column('income_growth_mean', sa.Float(), server_default='0.08', nullable=True),
            sa.Column('income_growth_vol', sa.Float(), server_default='0.03', nullable=True),
            sa.Column('inflation_mean', sa.Float(), server_default='0.06', nullable=True),
            sa.Column('inflation_vol', sa.Float(), server_default='0.015', nullable=True),
        )
        op.create_index(op.f('ix_user_profiles_id'), 'user_profiles', ['id'], unique=False)

    # 3. asset_allocations table
    if 'asset_allocations' not in tables:
        op.create_table(
            'asset_allocations',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('weight', sa.Float(), nullable=False),
            sa.Column('expected_return', sa.Float(), nullable=False),
            sa.Column('volatility', sa.Float(), nullable=False),
        )
        op.create_index(op.f('ix_asset_allocations_id'), 'asset_allocations', ['id'], unique=False)

    # 4. goals table
    if 'goals' not in tables:
        op.create_table(
            'goals',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('target_amount', sa.Float(), nullable=False),
            sa.Column('target_age', sa.Integer(), nullable=False),
        )
        op.create_index(op.f('ix_goals_id'), 'goals', ['id'], unique=False)

    # 5. life_events table
    if 'life_events' not in tables:
        op.create_table(
            'life_events',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('type', sa.String(), nullable=False),
            sa.Column('age', sa.Integer(), nullable=False),
            sa.Column('amount', sa.Float(), server_default='0.0', nullable=True),
            sa.Column('duration_years', sa.Integer(), server_default='0', nullable=True),
            sa.Column('probability', sa.Float(), server_default='1.0', nullable=True),
            sa.Column('income_factor', sa.Float(), server_default='0.0', nullable=True),
        )
        op.create_index(op.f('ix_life_events_id'), 'life_events', ['id'], unique=False)

    # 6. liabilities table
    if 'liabilities' not in tables:
        op.create_table(
            'liabilities',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
            sa.Column('name', sa.String(), nullable=False),
            sa.Column('principal', sa.Float(), nullable=False),
            sa.Column('interest_rate', sa.Float(), nullable=False),
            sa.Column('tenure_years', sa.Integer(), nullable=False),
            sa.Column('start_age', sa.Integer(), nullable=False),
            sa.Column('emi', sa.Float(), nullable=False),
            sa.Column('prepayment_monthly', sa.Float(), server_default='0.0', nullable=True),
            sa.Column('variable_rate_vol', sa.Float(), server_default='0.0', nullable=True),
        )
        op.create_index(op.f('ix_liabilities_id'), 'liabilities', ['id'], unique=False)

    # 7. simulation_runs table
    if 'simulation_runs' not in tables:
        op.create_table(
            'simulation_runs',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True, nullable=False),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
            sa.Column('job_id', sa.String(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('status', sa.String(), server_default='SUCCESS', nullable=True),
            sa.Column('terminal_wealth_mean', sa.Float(), nullable=True),
            sa.Column('terminal_wealth_median', sa.Float(), nullable=True),
            sa.Column('ruin_probability', sa.Float(), nullable=True),
            sa.Column('max_drawdown_p50', sa.Float(), nullable=True),
            sa.Column('result_data', sa.JSON(), nullable=True),
        )
        op.create_index(op.f('ix_simulation_runs_id'), 'simulation_runs', ['id'], unique=False)
        op.create_index(op.f('ix_simulation_runs_job_id'), 'simulation_runs', ['job_id'], unique=False)


def downgrade() -> None:
    op.drop_table('simulation_runs')
    op.drop_table('liabilities')
    op.drop_table('life_events')
    op.drop_table('goals')
    op.drop_table('asset_allocations')
    op.drop_table('user_profiles')
    op.drop_table('users')
