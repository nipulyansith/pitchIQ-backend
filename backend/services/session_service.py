"""Business logic for analysis-session lifecycle operations."""

import json
import shutil
from datetime import datetime
from pathlib import Path


def create_session_record(
    *, create_session, persist_session, validate_athlete, user_id, athlete_id
):
    """Create an in-memory session and persist its database record."""
    try:
        if not validate_athlete(athlete_id, user_id):
            return {"success": False, "error": "Athlete not found"}, 404

        session_id = create_session()
        try:
            persist_session(
                session_id=session_id,
                user_id=user_id,
                athlete_id=athlete_id,
            )
        except Exception:
            # Preserve the existing migration behavior: a database failure
            # must not discard an otherwise usable in-memory session.
            pass
        return {
            "success": True,
            "session_id": session_id,
            "message": "Session created successfully",
        }, 201
    except ValueError as error:
        return {"success": False, "error": str(error)}, 400
    except Exception as error:
        return {"success": False, "error": str(error)}, 500


def get_session_record(*, get_persisted_session, user_id, session_id):
    """Return one session from the database for its owning user."""
    persisted = get_persisted_session(session_id, user_id)
    if not persisted:
        return {"success": False, "error": "Session not found"}, 404
    return {"success": True, "session": persisted}, 200


def delete_session_record(
    *, sessions, results_dir: Path, delete_persisted_session, user_id, session_id
):
    """Delete one owned session, its result folder, and database row."""
    if not delete_persisted_session(session_id, user_id):
        return {"success": False, "error": "Session not found"}, 404

    try:
        result_folder = sessions[session_id].get("result_folder", session_id)
        session_path = results_dir / result_folder
        if session_path.exists():
            shutil.rmtree(session_path)
        del sessions[session_id]
        return {"success": True, "message": "Session deleted"}, 200
    except Exception as error:
        return {"success": False, "error": str(error)}, 500


def list_session_records(*, list_persisted_sessions, user_id):
    """List sessions from the database for the current user."""
    try:
        session_list = []
        for item in list_persisted_sessions(user_id):
            session_list.append({
                "session_id": item["id"],
                "display_name": item.get("video_name") or item["id"],
                "created_at": item.get("created_at"),
                "status": item.get("status"),
                "bowling_arm": item.get("bowling_arm"),
                "progress": item.get("progress", 0),
                "error": item.get("error_message"),
                "video_name": item.get("video_name"),
            })
        return {
            "success": True,
            "sessions": session_list,
            "count": len(session_list),
        }, 200
    except Exception as error:
        return {"success": False, "error": str(error)}, 500
