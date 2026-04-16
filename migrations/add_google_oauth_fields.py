"""
Migration script to add Google OAuth fields to users table.
Run this script to add the new columns for Google OAuth support.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database import engine, Base
from models.user import User

def migrate():
    """Add Google OAuth fields to users table."""
    with engine.connect() as conn:
        # Check if columns already exist
        inspector = inspect(engine)
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        
        columns_to_add = [
            ("google_id", "VARCHAR(255) UNIQUE"),
            ("picture", "VARCHAR(500)"),
            ("email_verified", "BOOLEAN DEFAULT FALSE"),
            ("validation_token", "VARCHAR(255)"),
        ]
        
        for column_name, column_type in columns_to_add:
            if column_name not in existing_columns:
                print(f"Adding column: {column_name}")
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))
                conn.commit()
            else:
                print(f"Column {column_name} already exists, skipping")
        
        # Add index for google_id if it doesn't exist
        indexes = inspector.get_indexes('users')
        index_names = [idx['name'] for idx in indexes]
        if 'ix_users_google_id' not in index_names:
            print("Adding index for google_id")
            conn.execute(text("CREATE INDEX ix_users_google_id ON users (google_id)"))
            conn.commit()
        else:
            print("Index ix_users_google_id already exists, skipping")
    
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
