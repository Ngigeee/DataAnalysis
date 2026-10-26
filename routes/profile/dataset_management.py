
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


dataset_management_bp = Blueprint(
    "dataset_management",
    __name__
)


# =========================================================
# VIEW DATASET
# GET /try_dataset/<dataset_id>
# =========================================================

@dataset_management_bp.route(
    "/try_dataset/<int:dataset_id>",
    methods=["GET"]
)
def try_dataset(dataset_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return redirect(url_for("login"))

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT *
            FROM datasets
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
            LIMIT 1
        """, (
            dataset_id,
            user_id
        ))

        dataset = cursor.fetchone()

        if not dataset:
            return "Dataset not found", 404

        return render_template(
            "try_dataset.html",
            dataset=dataset
        )

    finally:
        close_db(db, cursor)


# =========================================================
# DELETE DATASET
# POST /datasets/<dataset_id>/delete
# =========================================================

@dataset_management_bp.route(
    "/datasets/<int:dataset_id>/delete",
    methods=["POST"]
)
def delete_dataset(dataset_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # GET DATASET
        cursor.execute("""
            SELECT *
            FROM datasets
            WHERE id = %s
              AND user_id = %s
            LIMIT 1
        """, (
            dataset_id,
            user_id
        ))

        dataset = cursor.fetchone()

        if not dataset:
            return jsonify({
                "success": False,
                "message": "Dataset not found."
            }), 404

        # Get name BEFORE soft deletion
        dataset_name = (
            dataset.get("updated_name")
            or dataset.get("name")
            or dataset.get("original_name")
            or "Unnamed Dataset"
        )

        # SOFT DELETE
        cursor.execute("""
            UPDATE datasets
            SET status = 'deleted'
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            dataset_id,
            user_id
        ))

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "message": "Dataset could not be deleted."
            }), 404

        # ADD ACTIVITY
        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (
                %s,
                %s,
                %s,
                NOW()
            )
        """, (
            user_id,
            "delete_dataset",
            f'Deleted dataset "{dataset_name}"'
        ))

        # COMMIT
        db.commit()

        return jsonify({
            "success": True,
            "message": "Dataset deleted successfully.",
            "dataset_id": dataset_id
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
# RENAME DATASET
# POST /datasets/<dataset_id>/rename
# =========================================================

@dataset_management_bp.route(
    "/datasets/<int:dataset_id>/rename",
    methods=["POST"]
)
def rename_dataset(dataset_id):

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
            "message": "Dataset name is required."
        }), 400

    if len(name) > 255:
        return jsonify({
            "success": False,
            "message": "Dataset name is too long."
        }), 400

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:
        # GET EXISTING DATASET
        cursor.execute("""
            SELECT
                id,
                name,
                updated_name
            FROM datasets
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
            LIMIT 1
        """, (
            dataset_id,
            user_id
        ))

        dataset = cursor.fetchone()

        if not dataset:
            return jsonify({
                "success": False,
                "message": "Dataset not found."
            }), 404

        # Current displayed name
        old_name = (
            dataset.get("updated_name")
            or dataset.get("name")
            or "Unnamed Dataset"
        )

        # UPDATE DATASET NAME
        cursor.execute("""
            UPDATE datasets
            SET updated_name = %s
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            name,
            dataset_id,
            user_id
        ))

        # RECORD ACTIVITY
        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                entity_type,
                entity_id
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            user_id,
            "dataset_renamed",
            f"Renamed dataset from '{old_name}' to '{name}'",
            "dataset",
            dataset_id
        ))

        # COMMIT
        db.commit()

        return jsonify({
            "success": True,
            "message": "Dataset renamed successfully.",
            "dataset_id": dataset_id,
            "name": name
        })

    except Exception as e:
        db.rollback()

        print("Rename dataset error:", e)

        return jsonify({
            "success": False,
            "message": "Failed to rename dataset."
        }), 500

    finally:
        close_db(db, cursor)
