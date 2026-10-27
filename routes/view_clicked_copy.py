from flask import Blueprint, jsonify, request, session

import os
import json
import joblib
import pandas as pd
import numpy as np

from routes.config import get_db


view_clicked_copy_bp = Blueprint(
    "view_clicked_copy_bp",
    __name__
)


@view_clicked_copy_bp.route("/view_clicked_copy/<int:copy_id>")
def view_copy(copy_id):

    try:
        # =========================================
        # CHECK LOGIN
        # =========================================

        if "user" not in session:

            return jsonify({

                "success": False,

                "error":
                    "Please log in."

            }), 401


        user_id = session["user"]["id"]


        # ==========================================
        # DATABASE CONNECTION
        # ==========================================

        conn = get_db()
        cursor = conn.cursor(dictionary=True)


        # ==========================================
        # FIND COPY BELONGING TO LOGGED-IN USER
        #
        # IMPORTANT:
        # copy.user_id MUST MATCH session user_id
        # ==========================================

        cursor.execute(
            """
            SELECT
                c.*,
                d.original_name AS original_dataset_name
            FROM dataframe_copies c
            LEFT JOIN datasets d
                ON c.owner_dataframe_id = d.id
            WHERE c.id = %s
              AND c.user_id = %s
            """,
            (
                copy_id,
                user_id
            )
        )

        copy = cursor.fetchone()


        cursor.close()
        conn.close()


        # ==========================================
        # COPY DOES NOT EXIST OR DOES NOT BELONG
        # TO THIS USER
        # ==========================================

        if copy is None:

            return jsonify({
                "success": False,
                "error": "Copy not found"
            }), 404


        # ==========================================
        # LOAD COPY FILE
        # ==========================================

        with open(
            copy["file_path"],
            "r",
            encoding="utf-8"
        ) as f:

            data = json.load(f)


        # ==========================================
        # NORMALIZE DATA
        # ==========================================

        if isinstance(data, dict):

            if "data" in data:

                rows = data["data"]

            else:

                rows = [data]

        elif isinstance(data, list):

            rows = data

        else:

            rows = []


        # ==========================================
        # GET COLUMNS
        # ==========================================

        if rows:

            columns = list(
                rows[0].keys()
            )

        else:

            columns = []


        # ==========================================
        # MAKE DATA JSON SAFE
        # ==========================================

        safe_rows = []

        for row in rows:

            safe_row = {}

            for column, value in row.items():

                if (
                    value is None
                    or (
                        isinstance(value, float)
                        and (
                            np.isnan(value)
                            or np.isinf(value)
                        )
                    )
                ):

                    safe_row[column] = None

                elif isinstance(
                    value,
                    (
                        np.integer,
                        np.floating
                    )
                ):

                    safe_row[column] = value.item()

                else:

                    safe_row[column] = value

            safe_rows.append(
                safe_row
            )


        # ==========================================
        # FILE URL
        # ==========================================

        file_path = copy["file_path"]

        file_url = (
            "https://kijarney.co.ke/"
            + file_path.lstrip("/")
        )


        # ==========================================
        # RETURN VIEW DATA
        #
        # NO SESSION CHANGES
        # ==========================================

        return jsonify({

            "success": True,

            "id":
                copy["id"],

            "name":
                copy["updated_name"]
                or copy["name"]
                or "Dataset Copy",

            "original_dataset_id":
                copy["owner_dataframe_id"],

            "original_dataset_name":
                copy["original_dataset_name"]
                or "Unknown Dataset",

            "rows":
                len(safe_rows),

            "columns":
                columns,

            "file_type":
                "JSON",

            "file_size":
                copy.get("file_size"),

            "file_path":
                file_url,

            "created_at":
                copy.get("created_at"),

            "status":
                copy.get("status"),

            "data":
                safe_rows
        })


    except Exception as e:

        print(
            "View copy error:",
            e
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500