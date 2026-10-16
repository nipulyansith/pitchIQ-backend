"""Command-line entry point for creating the local SQLite database."""

try:
    # Works when run as: python backend/init_db.py
    from database import initialize_database
except ImportError:
    # Works when run as: python -m backend.init_db
    from .database import initialize_database


if __name__ == "__main__":
    database_path = initialize_database()
    print(f"Database initialized: {database_path}")
