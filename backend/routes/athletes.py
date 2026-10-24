"""Coach-managed athlete endpoints."""

from flask import Blueprint, jsonify, request, session as browser_session

from backend.services.athlete_service import (
    create_athlete_for_coach,
    get_coach_athlete,
    list_coach_athletes,
    remove_coach_athlete,
    update_coach_athlete,
)


def create_athletes_blueprint(coach_required):
    blueprint = Blueprint("athletes", __name__)

    @blueprint.post("/api/athletes")
    @coach_required
    def create():
        data = request.get_json(silent=True) or {}
        name = data.get("name", "")
        playing_level = data.get("playing_level")
        if not isinstance(name, str) or not name.strip():
            return jsonify({"success": False, "error": "Athlete name is required"}), 400

        try:
            athlete = create_athlete_for_coach(
                coach_id=browser_session["user_id"],
                name=name,
                playing_level=playing_level,
            )
            return jsonify({"success": True, "athlete": athlete}), 201
        except ValueError as error:
            return jsonify({"success": False, "error": str(error)}), 400

    @blueprint.get("/api/athletes")
    @coach_required
    def list_all():
        athletes = list_coach_athletes(coach_id=browser_session["user_id"])
        return jsonify({"success": True, "athletes": athletes}), 200

    @blueprint.get("/api/athletes/<int:athlete_id>")
    @coach_required
    def get_one(athlete_id):
        athlete = get_coach_athlete(
            athlete_id=athlete_id,
            coach_id=browser_session["user_id"],
        )
        if not athlete:
            return jsonify({"success": False, "error": "Athlete not found"}), 404
        return jsonify({"success": True, "athlete": athlete}), 200

    @blueprint.delete("/api/athletes/<int:athlete_id>")
    @coach_required
    def delete(athlete_id):
        deleted = remove_coach_athlete(
            athlete_id=athlete_id,
            coach_id=browser_session["user_id"],
        )
        if not deleted:
            return jsonify({"success": False, "error": "Athlete not found"}), 404
        return jsonify({"success": True, "message": "Athlete deleted"}), 200

    @blueprint.put("/api/athletes/<int:athlete_id>")
    @coach_required
    def update(athlete_id):
        data = request.get_json(silent=True) or {}
        name = data.get("name", "")
        if not isinstance(name, str) or not name.strip():
            return jsonify({"success": False, "error": "Athlete name is required"}), 400

        try:
            athlete = update_coach_athlete(
                athlete_id=athlete_id,
                coach_id=browser_session["user_id"],
                name=name,
                playing_level=data.get("playing_level"),
            )
        except ValueError as error:
            return jsonify({"success": False, "error": str(error)}), 400
        if not athlete:
            return jsonify({"success": False, "error": "Athlete not found"}), 404
        return jsonify({"success": True, "athlete": athlete}), 200

    return blueprint
