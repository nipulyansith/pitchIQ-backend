"""Analysis workflow routes."""

from flask import Blueprint, jsonify, request, session as browser_session

from backend.services.file_service import save_video_upload


def create_analysis_blueprint(*, dependencies, coach_required):
    blueprint = Blueprint("analysis", __name__)

    @blueprint.post("/api/upload/<session_id>")
    @coach_required
    def upload_video(session_id):
        user_id = browser_session["user_id"]
        persisted = dependencies["get_persisted_session"](session_id, user_id)
        if not persisted:
            return jsonify({"success": False, "error": "Session not found"}), 404
        if session_id not in dependencies["sessions"]:
            return jsonify({"success": False, "error": "Session is not active"}), 409
        if "video" not in request.files:
            return jsonify({"success": False, "error": "No video file provided"}), 400

        try:
            metadata = save_video_upload(
                file=request.files["video"],
                session_id=session_id,
                upload_dir=dependencies["upload_dir"],
                allowed_extensions=dependencies["allowed_extensions"],
                max_size=dependencies["max_file_size"],
            )
            video_name = request.form.get("video_name", "").strip() or metadata["original_name"]
            updated = dependencies["update_persisted_session"](
                session_id,
                user_id,
                video_name=video_name,
                video_path=str(metadata["path"]),
                status="video_uploaded",
            )
            if not updated:
                metadata["path"].unlink(missing_ok=True)
                return jsonify({"success": False, "error": "Session not found"}), 404

            dependencies["sessions"][session_id]["video_path"] = str(metadata["path"])
            dependencies["sessions"][session_id]["video_name"] = video_name
            dependencies["sessions"][session_id]["status"] = "video_uploaded"

            return jsonify({
                "success": True,
                "message": "Video uploaded successfully",
                "session_id": session_id,
                "video_info": {
                    "filename": metadata["filename"],
                    "fps": metadata["fps"],
                    "frame_count": metadata["frame_count"],
                    "width": metadata["width"],
                    "height": metadata["height"],
                    "duration_seconds": metadata["duration_seconds"],
                },
            }), 200
        except ValueError as error:
            return jsonify({"success": False, "error": str(error)}), 400
        except Exception as error:
            return jsonify({"success": False, "error": f"Upload failed: {error}"}), 500

    @blueprint.post("/api/bowling-arm/<session_id>")
    @coach_required
    def set_bowling_arm(session_id):
        user_id = browser_session["user_id"]
        persisted = dependencies["get_persisted_session"](session_id, user_id)
        if not persisted:
            return jsonify({"success": False, "error": "Session not found"}), 404
        if session_id not in dependencies["sessions"]:
            return jsonify({"success": False, "error": "Session is not active"}), 409

        data = request.get_json(silent=True) or {}
        arm = str(data.get("arm", "")).upper()
        if arm not in {"R", "L"}:
            return jsonify({"success": False, "error": "Arm must be R or L"}), 400

        updated = dependencies["update_persisted_session"](
            session_id,
            user_id,
            bowling_arm=arm,
            status="arm_selected",
        )
        if not updated:
            return jsonify({"success": False, "error": "Session not found"}), 404

        dependencies["sessions"][session_id]["bowling_arm"] = arm
        dependencies["sessions"][session_id]["status"] = "arm_selected"
        front_knee = "L" if arm == "R" else "R"
        return jsonify({
            "success": True,
            "message": f"Bowling arm set to {arm}",
            "session_id": session_id,
            "front_knee": front_knee,
        }), 200

    return blueprint
