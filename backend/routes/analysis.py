"""Analysis workflow routes."""

import math
from pathlib import Path

import cv2
from flask import Blueprint, jsonify, request, send_file, session as browser_session

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

    @blueprint.post("/api/process/<session_id>")
    @coach_required
    def process_video(session_id):
        user_id = browser_session["user_id"]
        persisted = dependencies["get_persisted_session"](session_id, user_id)
        if not persisted:
            return jsonify({"success": False, "error": "Session not found"}), 404

        active = dependencies["sessions"].get(session_id)
        if not active:
            return jsonify({"success": False, "error": "Session is not active"}), 409
        if not active.get("video_path"):
            return jsonify({"success": False, "error": "No video uploaded"}), 400
        if not active.get("bowling_arm"):
            return jsonify({"success": False, "error": "Bowling arm not selected"}), 400
        if not active.get("calibration_top") or not active.get("calibration_bottom"):
            return jsonify({"success": False, "error": "Calibration not set"}), 400

        started = dependencies["start_analysis"](
            session_id,
            user_id,
        )
        if not started:
            return jsonify({"success": False, "error": "Could not start processing"}), 500

        return jsonify({
            "success": True,
            "message": "Processing started",
            "session_id": session_id,
        }), 202

    @blueprint.get("/api/progress/<session_id>")
    @coach_required
    def get_progress(session_id):
        user_id = browser_session["user_id"]
        persisted = dependencies["get_persisted_session"](session_id, user_id)
        if not persisted:
            return jsonify({"success": False, "error": "Session not found"}), 404

        active = dependencies["sessions"].get(session_id)
        if not active:
            return jsonify({"success": False, "error": "Session is not active"}), 409
        synced = dependencies["update_session_progress"](
            session_id,
            user_id,
            active["progress"],
            status="failed" if active["status"] == "error" else active["status"],
            error_message=active.get("error"),
        )
        return jsonify({
            "success": True,
            "status": synced.get("status", active["status"]) if synced else active["status"],
            "progress": synced.get("progress", active["progress"]) if synced else active["progress"],
            "error": synced.get("error_message") if synced else active.get("error"),
        }), 200

    @blueprint.get("/api/results/<session_id>")
    @coach_required
    def get_results(session_id):
        user_id = browser_session["user_id"]
        persisted = dependencies["get_persisted_session"](session_id, user_id)
        if not persisted:
            return jsonify({"success": False, "error": "Session not found"}), 404

        if persisted.get("status") != "completed":
            return jsonify({
                "success": False,
                "error": f"Analysis not completed. Status: {persisted.get('status')}",
            }), 400

        metric_rows = dependencies["get_metric_results"](session_id, user_id)
        file_rows = dependencies["get_generated_files"](session_id, user_id)
        results = {
            row["metric_name"]: row.get("raw_result")
            for row in metric_rows
            if row.get("raw_result") is not None
        }
        results["videos"] = {
            row["file_type"]: row["file_path"]
            for row in file_rows
            if row["file_type"].lower().endswith((".mp4", ".webm", ".mov"))
        }
        results["generated_files"] = file_rows
        return jsonify({
            "success": True,
            "session": persisted,
            "results": dependencies["sanitize_for_json"](results),
        }), 200

    @blueprint.get("/api/calibration/preview/<session_id>")
    @coach_required
    def calibration_preview(session_id):
        user_id = browser_session["user_id"]
        persisted = dependencies["get_persisted_session"](session_id, user_id)
        if not persisted:
            return jsonify({"success": False, "error": "Session not found"}), 404

        video_path = persisted.get("video_path")
        if not video_path or not Path(video_path).is_file():
            return jsonify({"success": False, "error": "No video uploaded"}), 400

        capture = cv2.VideoCapture(video_path)
        try:
            ok, frame = capture.read()
        finally:
            capture.release()
        if not ok or frame is None:
            return jsonify({"success": False, "error": "Could not read first frame"}), 500

        preview_dir = dependencies["results_dir"] / session_id
        preview_dir.mkdir(parents=True, exist_ok=True)
        preview_path = preview_dir / "calibration_preview.jpg"
        if not cv2.imwrite(str(preview_path), frame):
            return jsonify({"success": False, "error": "Could not create calibration preview"}), 500
        return send_file(str(preview_path), mimetype="image/jpeg"), 200

    @blueprint.post("/api/calibration/<session_id>")
    @coach_required
    def save_calibration(session_id):
        user_id = browser_session["user_id"]
        persisted = dependencies["get_persisted_session"](session_id, user_id)
        if not persisted:
            return jsonify({"success": False, "error": "Session not found"}), 404
        if not persisted.get("video_path") or not Path(persisted["video_path"]).is_file():
            return jsonify({"success": False, "error": "No video uploaded"}), 400

        data = request.get_json(silent=True) or {}
        top = data.get("top")
        bottom = data.get("bottom")
        if not isinstance(top, dict) or not isinstance(bottom, dict):
            return jsonify({"success": False, "error": "Missing calibration points"}), 400

        try:
            top_x, top_y = int(round(float(top["x"]))), int(round(float(top["y"])))
            bottom_x, bottom_y = int(round(float(bottom["x"]))), int(round(float(bottom["y"])))
            stump_height = float(data.get("stump_height_m", 0.711))
        except (KeyError, TypeError, ValueError, OverflowError):
            return jsonify({"success": False, "error": "Calibration points must contain numeric x and y values"}), 400

        if stump_height <= 0 or not math.isfinite(stump_height):
            return jsonify({"success": False, "error": "stump_height_m must be greater than zero"}), 400

        pixel_distance = math.hypot(bottom_x - top_x, bottom_y - top_y)
        if pixel_distance <= 0:
            return jsonify({"success": False, "error": "Calibration points must be different"}), 400

        meters_per_pixel = stump_height / pixel_distance
        calibration = dependencies["upsert_calibration"](
            session_id,
            user_id,
            top_x,
            top_y,
            bottom_x,
            bottom_y,
            pixel_distance,
            stump_height,
            meters_per_pixel,
        )
        if not calibration:
            return jsonify({"success": False, "error": "Session not found"}), 404

        updated = dependencies["update_persisted_session"](
            session_id, user_id, status="calibrated"
        )
        if session_id in dependencies["sessions"]:
            active = dependencies["sessions"][session_id]
            active["calibration_top"] = (top_x, top_y)
            active["calibration_bottom"] = (bottom_x, bottom_y)
            active["status"] = "calibrated"

        return jsonify({
            "success": True,
            "message": "Calibration saved successfully",
            "session_id": session_id,
            "calibration": {
                "top": {"x": top_x, "y": top_y},
                "bottom": {"x": bottom_x, "y": bottom_y},
                "stump_height_m": stump_height,
                "pixel_distance": pixel_distance,
                "pixels_per_meter": 1 / meters_per_pixel,
                "meters_per_pixel": meters_per_pixel,
            },
            "session": updated,
        }), 200

    return blueprint
