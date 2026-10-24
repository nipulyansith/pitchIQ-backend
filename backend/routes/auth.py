"""Authentication endpoints for the PitchIQ API."""

from flask import Blueprint, current_app, jsonify, request, session

from backend.database import (
    create_user,
    get_user_by_id,
    verify_user_password,
)


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/register")
def register():
    """Register a user and create a logged-in browser session."""
    data = request.get_json(silent=True) or {}
    display_name = data.get("name", "")
    role = data.get("role", "coach")
    email = data.get("email", "")
    password = data.get("password", "")

    if (
        not isinstance(display_name, str)
        or not isinstance(email, str)
        or not isinstance(password, str)
        or role not in {"coach", "player"}
    ):
        return (
            jsonify(
                {
                    "success": False,
                    "error": "Name, email, password, and a valid role are required",
                }
            ),
            400,
        )

    try:
        user_id = create_user(email, password, display_name, role)
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 400
    except Exception as error:
        if "unique" in str(error).lower() or "constraint" in str(error).lower():
            return jsonify({"success": False, "error": "Email is already registered"}), 409
        current_app.logger.exception("Registration failed: %s", error)
        return jsonify({"success": False, "error": "Registration failed"}), 500

    user = get_user_by_id(user_id)
    session["user_id"] = user_id
    return jsonify({"success": True, "user": user}), 201


@auth_bp.post("/login")
def login():
    """Authenticate a user using a secure Flask session cookie."""
    data = request.get_json(silent=True) or {}
    email = data.get("email", "")
    password = data.get("password", "")

    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"success": False, "error": "Email and password are required"}), 400

    user = verify_user_password(email, password)
    if not user:
        return jsonify({"success": False, "error": "Invalid email or password"}), 401

    session.clear()
    session["user_id"] = user["id"]
    return jsonify({"success": True, "user": user}), 200


@auth_bp.get("/me")
def current_user():
    """Return the currently authenticated user, if one exists."""
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "authenticated": False}), 401

    user = get_user_by_id(user_id)
    if not user:
        session.clear()
        return jsonify({"success": False, "authenticated": False}), 401

    return jsonify({"success": True, "authenticated": True, "user": user}), 200


@auth_bp.post("/logout")
def logout():
    """Clear the current authenticated browser session."""
    session.clear()
    return jsonify({"success": True}), 200
