import json

from flask import Blueprint, jsonify

from routes.config import get_db
from routes.profile.profile_details import (
    get_logged_in_user_id,
    close_db,
    calculate_storage
)

full_profile_bp = Blueprint("full_profile", __name__)


# =========================================================
# FULL PROFILE
# GET /profile_details
# =========================================================

@full_profile_bp.route("/profile_details", methods=["GET"])
def get_full_profile():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # USER
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM users
            WHERE id = %s
            LIMIT 1
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        sensitive_fields = [
            "password",
            "password_hash",
            "reset_token",
            "verification_token",
            "oauth_token",
            "access_token"
        ]

        for field in sensitive_fields:
            user.pop(field, None)

        # -------------------------------------------------
        # API
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                id,
                user_id,
                name,
                created_at,
                last_used_at,
                expires_at,
                is_active
            FROM api_keys
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))

        api = cursor.fetchone()

        # -------------------------------------------------
        # DATASETS
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM datasets
            WHERE user_id = %s
              AND status = 'active'
            ORDER BY created_at DESC
        """, (user_id,))

        datasets = cursor.fetchall()

        # -------------------------------------------------
        # COPIES
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                c.*,
                d.original_name AS original_dataset_name,
                d.updated_name AS original_updated_name
            FROM dataframe_copies c
            LEFT JOIN datasets d
                ON d.id = c.dataset_id
                AND d.user_id = c.user_id
            WHERE c.user_id = %s
              AND c.status = 'active'
            ORDER BY c.created_at DESC
        """, (user_id,))

        copies = cursor.fetchall()

        # -------------------------------------------------
        # MODELS
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM saved_models
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        models = cursor.fetchall()

        for model in models:

            if isinstance(model.get("features"), str):
                try:
                    model["features"] = json.loads(
                        model["features"]
                    )
                except Exception:
                    pass

            if isinstance(model.get("metrics"), str):
                try:
                    model["metrics"] = json.loads(
                        model["metrics"]
                    )
                except Exception:
                    pass

        # -------------------------------------------------
        # ACTIVITY
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM activity
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user_id,))

        activity = cursor.fetchall()

        # -------------------------------------------------
        # STORAGE
        # -------------------------------------------------

        storage = calculate_storage(cursor, user_id)

        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return jsonify({
            "success": True,
            "user": user,
            "api": api,
            "datasets": datasets,
            "copies": copies,
            "models": models,
            "activity": activity,
            "storage": storage,
            "statistics": {
                "total_datasets": len(datasets),
                "total_copies": len(copies),
                "total_models": len(models),
                "total_activity": len(activity)
            }
        })

    finally:
        close_db(db, cursor)