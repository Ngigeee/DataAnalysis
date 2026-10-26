from flask import Blueprint, jsonify, session
from .config import get_db

viewCopies_bp = Blueprint("viewCopy", __name__)

@viewCopies_bp.route("/view_copies", methods=["GET"])
def get_copies():

    try:

        owner_dataframe_id = session.get("active_dataset_id")

        if owner_dataframe_id is None:
            return jsonify({
                "success": False,
                "error": "No active dataset."
            }), 400

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                name,
                row_count,
                created_at
            FROM dataframe_copies
            WHERE owner_dataframe_id = %s
            ORDER BY created_at DESC
        """, (owner_dataframe_id,))

        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "copies": rows
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
