from flask import (
    Blueprint,
    jsonify,
    session,
    request,
    redirect,
    url_for,
    render_template
)

from routes.config import get_db

import os
import json


# =========================================================
# CREATE BLUEPRINT
# =========================================================

profile_details_bp = Blueprint(
    'profile',
    __name__,
    url_prefix='/profile_details'
)


# =========================================================
# LOGIN CHECK
# =========================================================

def get_logged_in_user_id():

    user = session.get("user")

    if not user:
        return None

    return user.get("id")


# =========================================================
# DATABASE HELPERS
# =========================================================

def close_db(db, cursor):

    try:
        cursor.close()
    except Exception:
        pass

    try:
        db.close()
    except Exception:
        pass


# =========================================================
# USER DETAILS
# GET /profile_details/user
# =========================================================

@profile_details_bp.route('/user', methods=['GET'])
def get_user():

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
            'password',
            'password_hash',
            'reset_token',
            'verification_token',
            'oauth_token',
            'access_token'
        ]

        for field in sensitive_fields:
            user.pop(field, None)

        storage = calculate_storage(
            cursor,
            user_id
        )

        return jsonify({
            "success": True,
            "user": user,
            "storage": storage
        })

    finally:

        close_db(db, cursor)


# =========================================================
# API KEY
# GET /profile_details/api
# =========================================================

@profile_details_bp.route('/api', methods=['GET'])
def get_api():

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

        api_key = cursor.fetchone()

        return jsonify({
            "success": True,
            "api_key": api_key
        })

    finally:

        close_db(db, cursor)



# =========================================================
# STORAGE CALCULATOR
#
# IMPORTANT:
# Only ACTIVE datasets and ACTIVE copies count.
#
# Models are counted from saved model files.
# =========================================================

def calculate_storage(cursor, user_id):

    # -----------------------------------------------------
    # ACTIVE DATASETS
    # -----------------------------------------------------

    cursor.execute("""
        SELECT COALESCE(SUM(file_size), 0) AS total_size

        FROM datasets

        WHERE user_id = %s
          AND status = 'active'
    """, (user_id,))

    dataset_result = cursor.fetchone()

    dataset_storage = int(
        dataset_result["total_size"]
        if dataset_result
        and dataset_result["total_size"]
        else 0
    )


    # -----------------------------------------------------
    # ACTIVE COPIES
    # -----------------------------------------------------

    cursor.execute("""
        SELECT file_path

        FROM dataframe_copies

        WHERE user_id = %s
          AND status = 'active'
    """, (user_id,))

    copies = cursor.fetchall()

    copy_storage = 0

    for copy in copies:

        file_path = copy.get("file_path")

        if not file_path:
            continue

        try:

            if os.path.isfile(file_path):

                copy_storage += os.path.getsize(
                    file_path
                )

        except (OSError, TypeError):

            continue


    # -----------------------------------------------------
    # SAVED MODELS
    # -----------------------------------------------------

    cursor.execute("""
        SELECT file_path

        FROM saved_models

        WHERE user_id = %s
    """, (user_id,))

    models = cursor.fetchall()

    model_storage = 0

    for model in models:

        file_path = model.get("file_path")

        if not file_path:
            continue

        try:

            if os.path.isfile(file_path):

                model_storage += os.path.getsize(
                    file_path
                )

        except (OSError, TypeError):

            continue


    # -----------------------------------------------------
    # TOTAL
    # -----------------------------------------------------

    total_storage = (
        dataset_storage
        + copy_storage
        + model_storage
    )


    # -----------------------------------------------------
    # LIMIT
    # -----------------------------------------------------

    free_limit = 500 * 1024 * 1024


    percentage = (
        (total_storage / free_limit) * 100
        if free_limit > 0
        else 0
    )


    return {

        "used_bytes": total_storage,

        "limit_bytes": free_limit,

        "datasets_bytes": dataset_storage,

        "copies_bytes": copy_storage,

        "models_bytes": model_storage,

        "percentage": round(
            min(percentage, 100),
            2
        )
    }

