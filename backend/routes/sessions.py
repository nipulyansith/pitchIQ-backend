"""Session-management routes for the PitchIQ API.

The route layer is intentionally thin. The application supplies the existing
session handlers while the migration is completed incrementally, preserving
the current API responses and frontend contract.
"""

from flask import Blueprint, jsonify, session as browser_session

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
        payload, status = create_session_record(
            create_session=dependencies["create_session"],
            persist_session=dependencies["persist_session"],
            user_id=browser_session.get("user_id"),
        )
        return jsonify(payload), status

    @blueprint.get("/api/session/<session_id>")
    @coach_required
    def get(session_id):
        payload, status = get_session_record(
            sessions=dependencies["sessions"],
            session_id=session_id,
        )
        return jsonify(payload), status

    @blueprint.delete("/api/session/<session_id>")
    @coach_required
    def delete(session_id):
        payload, status = delete_session_record(
            sessions=dependencies["sessions"],
            results_dir=dependencies["results_dir"],
            session_id=session_id,
        )
        return jsonify(payload), status

    @blueprint.get("/api/sessions")
    @coach_required
    def list_all():
        payload, status = list_session_records(
            sessions=dependencies["sessions"],
            results_dir=dependencies["results_dir"],
            sanitize_for_json=dependencies["sanitize_for_json"],
        )
        return jsonify(payload), status

    return blueprint
