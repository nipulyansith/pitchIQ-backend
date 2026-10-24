"""Session-management routes for the PitchIQ API.

The route layer is intentionally thin. The application supplies the existing
session handlers while the migration is completed incrementally, preserving
the current API responses and frontend contract.
"""

from flask import Blueprint, jsonify, request, session as browser_session

from backend.services.session_service import (
    create_session_record,
    delete_session_record,
    get_session_record,
    list_session_records,
)


def create_sessions_blueprint(*, dependencies, coach_required):
    """Create the session blueprint around application-owned dependencies."""
    blueprint = Blueprint("sessions", __name__)

    @blueprint.post("/api/session/create")
    @coach_required
    def create():
        data = request.get_json(silent=True) or {}
        athlete_id = data.get("athlete_id")
        if isinstance(athlete_id, bool) or not isinstance(athlete_id, int):
            return jsonify({
                "success": False,
                "error": "athlete_id is required",
            }), 400

        payload, status = create_session_record(
            create_session=dependencies["create_session"],
            persist_session=dependencies["persist_session"],
            validate_athlete=dependencies["validate_athlete"],
            user_id=browser_session.get("user_id"),
            athlete_id=athlete_id,
        )
        return jsonify(payload), status

    @blueprint.get("/api/session/<session_id>")
    @coach_required
    def get(session_id):
        payload, status = get_session_record(
            get_persisted_session=dependencies["get_persisted_session"],
            user_id=browser_session["user_id"],
            session_id=session_id,
        )
        return jsonify(payload), status

    @blueprint.delete("/api/session/<session_id>")
    @coach_required
    def delete(session_id):
        payload, status = delete_session_record(
            sessions=dependencies["sessions"],
            results_dir=dependencies["results_dir"],
            delete_persisted_session=dependencies["delete_persisted_session"],
            user_id=browser_session["user_id"],
            session_id=session_id,
        )
        return jsonify(payload), status

    @blueprint.get("/api/sessions")
    @coach_required
    def list_all():
        payload, status = list_session_records(
            list_persisted_sessions=dependencies["list_persisted_sessions"],
            user_id=browser_session["user_id"],
        )
        return jsonify(payload), status

    return blueprint
