"""create_receipts_table

Revision ID: create_receipts_table
Revises: previous_revision
Create Date: 2024-02-14 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table(
        'receipts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('vendor', sa.String(), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('time', sa.String(), nullable=False),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('tax', sa.Float(), nullable=False),
        sa.Column('change', sa.Float(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('items', postgresql.JSON(), nullable=False),
        sa.Column('image_urls', postgresql.JSON(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_receipts_id'), 'receipts', ['id'], unique=False)

def downgrade():
    op.drop_index(op.f('ix_receipts_id'), table_name='receipts')
    op.drop_table('receipts')