from flask import Blueprint, request, jsonify, session
import os
import json
from .config import get_db

saveCopies_bp = Blueprint("saveCopy", __name__)

@saveCopies_bp.route("/save_copies", methods=["POST"])
def create_copy():

    try:

        body = request.get_json()

        name = body["name"]
        dataframe = body["data"]

        owner_dataframe_id = session.get("active_dataset_id")

        if owner_dataframe_id is None:
            return jsonify({
                "success": False,
                "error": "No active dataset."
            }), 400

        user_id = None

        if "user" in session:
            user_id = session["user"]["id"]

        # Create copies folder
        copies_folder = os.path.join(
            "datasets",
            str(owner_dataframe_id),
            "copies"
        )

        os.makedirs(copies_folder, exist_ok=True)

        # Save as JSON
        filename = f"{name}.json"

        # Replace invalid filename characters
        filename = "".join(
            c for c in filename
            if c not in r'\/:*?"<>|'
        )

        file_path = os.path.join(copies_folder, filename)

        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(dataframe, f)

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO dataframe_copies
            (
                owner_dataframe_id,
                user_id,
                name,
                file_path,
                row_count
            )
            VALUES (%s,%s,%s,%s,%s)
            """,
            (
                owner_dataframe_id,
                user_id,
                name,
                file_path,
                len(dataframe)
            )
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
