
import os

from flask import (
    Blueprint,
    redirect,
    url_for,
    jsonify,
    request,
    render_template,
)

from routes.config import get_db
from routes.profile.profile_details import (
    get_logged_in_user_id,
    close_db,
)


copy_management_bp = Blueprint("copy_management", __name__)


# =========================================================
# VIEW COPY
# GET /try_copy/<copy_id>
# =========================================================

@copy_management_bp.route(
    "/try_copy/<int:copy_id>",
    methods=["GET"]
)
def try_copy(copy_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return redirect(url_for("login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                c.*,
                d.original_name AS original_dataset_name,
                d.updated_name AS original_updated_name
            FROM dataframe_copies c
            LEFT JOIN datasets d
                ON d.id = c.dataset_id
                AND d.user_id = c.user_id
            WHERE c.id = %s
              AND c.user_id = %s
              AND c.status = 'active'
            LIMIT 1
        """, (
            copy_id,
            user_id
        ))

        copy = cursor.fetchone()

        if not copy:
            return "Dataset copy not found", 404

        return render_template(
            "try_copy.html",
            copy=copy
        )

    finally:
        close_db(db, cursor)


# =========================================================
# RENAME COPY
# POST /copies/<copy_id>/rename
# =========================================================

@copy_management_bp.route(
    "/copies/<int:copy_id>/rename",
    methods=["POST"]
)
def rename_copy(copy_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    data = request.get_json(silent=True) or request.form

    name = str(data.get("name", "")).strip()

    if not name:
        return jsonify({
            "success": False,
            "message": "Copy name is required."
        }), 400

    if len(name) > 255:
        return jsonify({
            "success": False,
            "message": "Copy name is too long."
        }), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # GET CURRENT COPY NAME
        cursor.execute("""
            SELECT
                id,
                name,
                updated_name
            FROM dataframe_copies
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
            LIMIT 1
        """, (
            copy_id,
            user_id
        ))

        copy = cursor.fetchone()

        if not copy:
            return jsonify({
                "success": False,
                "message": "Dataset copy not found."
            }), 404

        old_name = (
            copy.get("updated_name")
            or copy.get("name")
            or "Dataset Copy"
        )

        # UPDATE COPY NAME
        cursor.execute("""
            UPDATE dataframe_copies
            SET updated_name = %s
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            name,
            copy_id,
            user_id
        ))

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Dataset copy was not renamed."
            }), 404

        # ADD ACTIVITY
        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (%s, %s, %s, NOW())
        """, (
            user_id,
            "rename_copy",
            f'Renamed dataset copy "{old_name}" to "{name}"'
        ))

        # COMMIT
        db.commit()

        return jsonify({
            "success": True,
            "message": "Dataset copy renamed successfully.",
            "copy_id": copy_id,
            "name": name
        })

    except Exception as e:
        db.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        close_db(db, cursor)


# =========================================================
# DELETE COPY
# POST /copies/<copy_id>/delete
# =========================================================

@copy_management_bp.route(
    "/copies/<int:copy_id>/delete",
    methods=["POST"]
)
def delete_copy(copy_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # GET COPY
        cursor.execute("""
            SELECT *
            FROM dataframe_copies
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
            LIMIT 1
        """, (
            copy_id,
            user_id
        ))

        copy = cursor.fetchone()

        if not copy:
            return jsonify({
                "success": False,
                "message": "Dataset copy not found."
            }), 404

        # GET COPY NAME
        copy_name = (
            copy.get("updated_name")
            or copy.get("name")
            or "Dataset Copy"
        )

        # GET FILE PATH
        file_path = copy.get("file_path")

        # DELETE FILE
        if file_path:
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except OSError:
                # Continue with database soft delete.
                pass

        # SOFT DELETE
        cursor.execute("""
            UPDATE dataframe_copies
            SET status = 'deleted'
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            copy_id,
            user_id
        ))

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Dataset copy could not be deleted."
            }), 404

        # ADD ACTIVITY
        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (%s, %s, %s, NOW())
        """, (
            user_id,
            "delete_copy",
            f'Deleted dataset copy "{copy_name}"'
        ))

        # COMMIT
        db.commit()

        return jsonify({
            "success": True,
            "message": "Dataset copy deleted successfully.",
            "copy_id": copy_id
        })

    except Exception as e:
        db.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        close_db(db, cursor)
