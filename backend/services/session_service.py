"""Business logic for analysis-session lifecycle operations."""

import json
import shutil
from datetime import datetime
from pathlib import Path


def create_session_record(*, create_session, persist_session, user_id):
    """Create an in-memory session and persist its database record."""
    try:
        session_id = create_session()
        try:
            persist_session(session_id=session_id, user_id=user_id)
        except Exception:
            # Preserve the existing migration behavior: a database failure
            # must not discard an otherwise usable in-memory session.
            pass
        return {
            "success": True,
            "session_id": session_id,
            "message": "Session created successfully",
        }, 201
    except Exception as error:
        return {"success": False, "error": str(error)}, 500


def get_session_record(*, sessions, session_id):
    """Return one in-memory session."""
    if session_id not in sessions:
        return {"success": False, "error": "Session not found"}, 404
    return {"success": True, "session": sessions[session_id].copy()}, 200


def delete_session_record(*, sessions, results_dir: Path, session_id):
    """Delete one session and only its associated result directory."""
    if session_id not in sessions:
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


def list_session_records(*, sessions, results_dir: Path, sanitize_for_json):
    """List active sessions and completed result folders on disk."""
    try:
        session_list = []

        for session_id, item in sessions.items():
            display_name = item.get("video_name") or item.get("result_folder", session_id)
            session_list.append({
                "session_id": session_id,
                "display_name": display_name,
                "created_at": item.get("created_at"),
                "status": item.get("status"),
                "bowling_arm": item.get("bowling_arm"),
                "results": item.get("results"),
            })

        if results_dir.exists():
            known_folders = {
                item.get("result_folder") for item in sessions.values()
            }
            for session_dir in results_dir.iterdir():
                if not session_dir.is_dir() or session_dir.name in known_folders:
                    continue

                analysis_file = session_dir / "analysis_results.json"
                if not analysis_file.exists():
                    continue

                try:
                    with analysis_file.open(encoding="utf-8") as file:
                        analysis_data = sanitize_for_json(json.load(file))

                    raw_results = analysis_data.get("results", {})
                    results = {
                        "stride_duration": raw_results.get("cadence"),
                        "delivery_stride": raw_results.get("stride"),
                        "elbow_flexion": raw_results.get("elbow"),
                        "knee_flexion": raw_results.get("knee"),
                        "head_position": raw_results.get("head"),
                        "wrist_velocity": raw_results.get("wrist"),
                    }
                    session_list.append({
                        "session_id": session_dir.name,
                        "display_name": session_dir.name,
                        "created_at": analysis_data.get(
                            "timestamp", session_dir.stat().st_mtime
                        ),
                        "status": "completed",
                        "bowling_arm": analysis_data.get("bowling_arm"),
                        "results": results,
                    })
                except Exception:
                    # Ignore one malformed result folder and continue listing.
                    continue

        def sort_key(item):
            created_at = item.get("created_at", "")
            if isinstance(created_at, str):
                try:
                    return datetime.fromisoformat(
                        created_at.replace("Z", "+00:00")
                    ).timestamp()
                except (TypeError, ValueError, OverflowError):
                    return 0
            return created_at if isinstance(created_at, (int, float)) else 0

        session_list.sort(key=sort_key, reverse=True)
        return {
            "success": True,
            "sessions": session_list,
            "count": len(session_list),
        }, 200
    except Exception as error:
        return {"success": False, "error": str(error)}, 500
