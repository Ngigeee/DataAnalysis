import os
import json

from flask import Blueprint, jsonify

from routes.config import get_db
from routes.profile.profile_details import (
    get_logged_in_user_id,
    close_db
)

profile_data_bp = Blueprint(
    "profile_data",
    __name__,
    url_prefix="/profile_details"
)


# =========================================================
# DATASETS
# GET /profile_details/datasets
# =========================================================

@profile_data_bp.route("/datasets", methods=["GET"])
def get_datasets():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT *
            FROM datasets
            WHERE user_id = %s
              AND status = 'active'
            ORDER BY created_at DESC
        """, (user_id,))

        datasets = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(datasets),
            "datasets": datasets
        })

    finally:
        close_db(db, cursor)


# =========================================================
# DATASET COPIES
# GET /profile_details/copies
# =========================================================

@profile_data_bp.route("/copies", methods=["GET"])
def get_copies():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                c.id,
                c.owner_dataframe_id,
                c.user_id,
                c.name,
                c.updated_name,
                c.file_path,
                c.row_count,
                c.created_at,
                c.status,

                d.id AS original_dataset_id,
                d.original_name AS original_dataset_name,
                d.stored_name AS original_dataset_stored_name

            FROM dataframe_copies c

            LEFT JOIN datasets d
                ON c.owner_dataframe_id = d.id

            WHERE c.user_id = %s
              AND c.status = 'active'

            ORDER BY c.created_at DESC
        """, (user_id,))

        copies = cursor.fetchall()

        # Add file size
        for copy in copies:

            file_path = copy.get("file_path")
            copy["file_size"] = 0

            if file_path:
                try:
                    if os.path.isfile(file_path):
                        copy["file_size"] = os.path.getsize(
                            file_path
                        )
                except (OSError, TypeError):
                    copy["file_size"] = 0

        return jsonify({
            "success": True,
            "count": len(copies),
            "copies": copies
        })

    finally:
        close_db(db, cursor)


# =========================================================
# SAVED MODELS
# GET /profile_details/models
# =========================================================

@profile_data_bp.route("/models", methods=["GET"])
def get_models():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
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

            # Fallback name for older models
            if not model.get("name"):
                model["name"] = (
                    f"{str(model.get('model_type', 'Model')).replace('_', ' ').title()}"
                    f" - {model.get('target', 'Target')}"
                )

        return jsonify({
            "success": True,
            "count": len(models),
            "models": models
        })

    finally:
        close_db(db, cursor)


# =========================================================
# ACTIVITY
# GET /profile_details/activity
# =========================================================

@profile_data_bp.route("/activity", methods=["GET"])
def get_activity():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT *
            FROM activity
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user_id,))

        activities = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(activities),
            "activity": activities
        })

    finally:
        close_db(db, cursor)