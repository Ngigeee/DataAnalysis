from flask import request, jsonify, session,Blueprint
from .config import get_db

renamedatasets_bp = Blueprint("renamedatasets", __name__)
# --------------------------------------------------
# RENAME DATASET
# --------------------------------------------------
@renamedatasets_bp.route("/rename_dataset/<int:dataset_id>", methods=["POST"])
def rename_dataset(dataset_id):

    try:

        if "user" not in session:
            return jsonify({
                "success": False,
                "error": "Please log in."
            }), 401

        new_name = request.json.get("name", "").strip()

        if not new_name:
            return jsonify({
                "success": False,
                "error": "Dataset name is required."
            }), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE datasets
            SET updated_name=%s
            WHERE id=%s
            AND user_id=%s
            """,
            (
                new_name,
                dataset_id,
                session["user"]["id"]
            )
        )

        conn.commit()

        updated = cursor.rowcount

        cursor.close()
        conn.close()

        if updated == 0:
            return jsonify({
                "success": False,
                "error": "Dataset not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Dataset renamed."
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# --------------------------------------------------
# DELETE DATASET (SOFT DELETE)
# --------------------------------------------------
@renamedatasets_bp.route("/delete_dataset/<int:dataset_id>", methods=["POST"])
def delete_dataset(dataset_id):

    try:

        if "user" not in session:
            return jsonify({
                "success": False,
                "error": "Please log in."
            }), 401

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE datasets
            SET status='deleted'
            WHERE id=%s
            AND user_id=%s
            """,
            (
                dataset_id,
                session["user"]["id"]
            )
        )

        conn.commit()

        updated = cursor.rowcount

        cursor.close()
        conn.close()

        if updated == 0:
            return jsonify({
                "success": False,
                "error": "Dataset not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Dataset deleted."
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# --------------------------------------------------
# RENAME COPY
# --------------------------------------------------
@renamedatasets_bp.route("/rename_copy/<int:copy_id>", methods=["POST"])
def rename_copy(copy_id):

    try:

        if "user" not in session:
            return jsonify({
                "success": False,
                "error": "Please log in."
            }), 401

        new_name = request.json.get("name", "").strip()

        if not new_name:
            return jsonify({
                "success": False,
                "error": "Copy name is required."
            }), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE dataframe_copies
            SET updated_name=%s
            WHERE id=%s
            AND user_id=%s
            """,
            (
                new_name,
                copy_id,
                session["user"]["id"]
            )
        )

        conn.commit()

        updated = cursor.rowcount

        cursor.close()
        conn.close()

        if updated == 0:
            return jsonify({
                "success": False,
                "error": "Copy not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Copy renamed."
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# --------------------------------------------------
# DELETE COPY (SOFT DELETE)
# --------------------------------------------------
@renamedatasets_bp.route("/delete_copy/<int:copy_id>", methods=["POST"])
def delete_copy(copy_id):

    try:

        if "user" not in session:
            return jsonify({
                "success": False,
                "error": "Please log in."
            }), 401

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE dataframe_copies
            SET status='deleted'
            WHERE id=%s
            AND user_id=%s
            """,
            (
                copy_id,
                session["user"]["id"]
            )
        )

        conn.commit()

        updated = cursor.rowcount

        cursor.close()
        conn.close()

        if updated == 0:
            return jsonify({
                "success": False,
                "error": "Copy not found."
            }), 404

        return jsonify({
            "success": True,
            "message": "Copy deleted."
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
