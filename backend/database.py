"""SQLite database setup and small persistence helpers.

This module is intentionally independent from the existing root-level app.py.
It gives us a persistent foundation before migrating the existing API routes.
"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from werkzeug.security import check_password_hash, generate_password_hash


PROJECT_ROOT = Path(__file__).resolve().parent.parent
STORAGE_DIR = PROJECT_ROOT / "storage"
DATABASE_PATH = STORAGE_DIR / "pitchiq.db"


SCHEMA = """
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('coach', 'player')),
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS athletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    playing_level TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analysis_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    athlete_id INTEGER,
    video_name TEXT,
    video_path TEXT,
    bowling_arm TEXT CHECK (bowling_arm IN ('R', 'L')),
    status TEXT NOT NULL DEFAULT 'created',
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    result_path TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS calibrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    top_x INTEGER NOT NULL,
    top_y INTEGER NOT NULL,
    bottom_x INTEGER NOT NULL,
    bottom_y INTEGER NOT NULL,
    pixel_distance REAL NOT NULL CHECK (pixel_distance > 0),
    meters_per_pixel REAL NOT NULL CHECK (meters_per_pixel > 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS metric_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value REAL,
    unit TEXT,
    event_name TEXT,
    event_frame INTEGER,
    status TEXT NOT NULL DEFAULT 'measured',
    confidence_level TEXT,
    confidence_score REAL CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
    confidence_reasons TEXT,
    raw_result_json TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    UNIQUE (session_id, metric_name)
);

CREATE TABLE IF NOT EXISTS generated_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE,
    UNIQUE (session_id, file_type)
);

CREATE INDEX IF NOT EXISTS idx_sessions_athlete_id
    ON analysis_sessions(athlete_id);

CREATE INDEX IF NOT EXISTS idx_sessions_status
    ON analysis_sessions(status);

CREATE INDEX IF NOT EXISTS idx_metrics_session_id
    ON metric_results(session_id);
"""


def ensure_database_directory() -> None:
    """Create the storage directory if it does not exist."""
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)


def get_connection() -> sqlite3.Connection:
    """Open a database connection configured for application use."""
    ensure_database_directory()
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def initialize_database() -> Path:
    """Create all database tables and indexes, if necessary."""
    with get_connection() as connection:
        connection.executescript(SCHEMA)
        # Existing databases were created before authentication was added.
        # SQLite cannot add a foreign key constraint with ALTER TABLE, but the
        # columns can be added safely and the application enforces ownership.
        _add_column_if_missing(connection, "athletes", "user_id", "INTEGER")
        _add_column_if_missing(connection, "analysis_sessions", "user_id", "INTEGER")
        _add_column_if_missing(connection, "users", "display_name", "TEXT NOT NULL DEFAULT ''")
        _add_column_if_missing(connection, "users", "role", "TEXT NOT NULL DEFAULT 'coach'")
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON athletes(user_id)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON analysis_sessions(user_id)"
        )
    return DATABASE_PATH


def _add_column_if_missing(
    connection: sqlite3.Connection,
    table_name: str,
    column_name: str,
    column_definition: str,
) -> None:
    """Apply a small additive migration to an existing SQLite database."""
    columns = {
        row[1]
        for row in connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    }
    if column_name not in columns:
        connection.execute(
            f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_definition}"
        )


@contextmanager
def database_connection() -> Iterator[sqlite3.Connection]:
    """Yield a connection and commit successful changes automatically."""
    connection = get_connection()
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def create_athlete(name: str, playing_level: str | None = None) -> int:
    """Create an athlete and return its database ID."""
    cleaned_name = name.strip()
    if not cleaned_name:
        raise ValueError("Athlete name cannot be empty")

    with database_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO athletes (name, playing_level) VALUES (?, ?)",
            (cleaned_name, playing_level),
        )
        return int(cursor.lastrowid)


def create_user(email: str, password: str, display_name: str = "", role: str = "coach") -> int:
    """Create a user with a one-way password hash and return its ID."""
    normalized_email = email.strip().lower()
    if not normalized_email or "@" not in normalized_email:
        raise ValueError("A valid email address is required")
    if len(password) < 8:
        raise ValueError("Password must contain at least 8 characters")
    if role not in {"coach", "player"}:
        raise ValueError("Role must be coach or player")

    cleaned_name = display_name.strip() or normalized_email.split("@", 1)[0]

    with database_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO users (display_name, role, email, password_hash)
            VALUES (?, ?, ?, ?)
            """,
            (cleaned_name, role, normalized_email, generate_password_hash(password)),
        )
        return int(cursor.lastrowid)


def get_user_by_email(email: str) -> dict[str, Any] | None:
    """Find a user by email without exposing the password hash to callers."""
    normalized_email = email.strip().lower()
    with database_connection() as connection:
        row = connection.execute(
            "SELECT id, display_name, role, email, password_hash, created_at FROM users WHERE email = ?",
            (normalized_email,),
        ).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: int) -> dict[str, Any] | None:
    """Find a user by primary key."""
    with database_connection() as connection:
        row = connection.execute(
            "SELECT id, display_name, role, email, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["display_name"],
        "role": row["role"],
        "email": row["email"],
        "created_at": row["created_at"],
    }


def verify_user_password(email: str, password: str) -> dict[str, Any] | None:
    """Return the user if the supplied password is correct."""
    user = get_user_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return None
    return {
        "id": user["id"],
        "name": user["display_name"],
        "role": user["role"],
        "email": user["email"],
        "created_at": user["created_at"],
    }


def create_analysis_session(
    session_id: str,
    user_id: int | None = None,
    athlete_id: int | None = None,
    video_name: str | None = None,
) -> None:
    """Persist a new analysis session."""
    with database_connection() as connection:
        connection.execute(
            """
            INSERT INTO analysis_sessions (id, user_id, athlete_id, video_name)
            VALUES (?, ?, ?, ?)
            """,
            (session_id, user_id, athlete_id, video_name),
        )


def get_analysis_session(session_id: str) -> dict[str, Any] | None:
    """Return one session as a normal dictionary, or None if missing."""
    with database_connection() as connection:
        row = connection.execute(
            "SELECT * FROM analysis_sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
    return dict(row) if row else None


if __name__ == "__main__":
    path = initialize_database()
    print(f"Database initialized: {path}")
