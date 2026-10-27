from flask import Blueprint, jsonify, request, session

import os
import json
import joblib
import pandas as pd
import numpy as np

from routes.config import get_db


view_clicked_dataset_bp = Blueprint(
    "view_clicked_dataset_bp",
    __name__
)
@view_clicked_dataset_bp.route("/view_clicked_dataset/<int:item_id>")
def view_dataset(item_id):

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
        # FIND DATASET BELONGING TO LOGGED-IN USER
        # ==========================================

        cursor.execute(
            """
            SELECT *
            FROM datasets
            WHERE id = %s
              AND user_id = %s
            """,
            (
                item_id,
                user_id
            )
        )

        dataset = cursor.fetchone()


        cursor.close()
        conn.close()


        # ==========================================
        # DATASET DOES NOT EXIST OR DOES NOT BELONG
        # TO THIS USER
        # ==========================================

        if dataset is None:

            return jsonify({
                "success": False,
                "error": "Dataset not found"
            }), 404


        # ==========================================
        # LOAD FILE
        # ==========================================

        if dataset["file_type"].lower() == "csv":

            df = pd.read_csv(
                dataset["file_path"]
            )

        else:

            df = pd.read_json(
                dataset["file_path"]
            )


        # ==========================================
        # MAKE DATA JSON SAFE
        # ==========================================

        frontend_df = (
            df.astype(object)
              .replace(
                  [np.nan, np.inf, -np.inf],
                  None
              )
              .where(
                  pd.notnull(df),
                  None
              )
        )


        # ==========================================
        # RETURN DATA
        #
        # IMPORTANT:
        # NO SESSION CHANGES
        # ==========================================

        return jsonify({

            "success": True,

            "id":
                dataset["id"],

            "name":
                dataset["original_name"],

            "rows":
                len(df),

            "columns":
                list(df.columns),

            "file_type":
                dataset["file_type"],

            "file_size":
                dataset.get("file_size"),

            "data":
                frontend_df.to_dict(
                    orient="records"
                )
        })


    except Exception as e:

        print(
            "View dataset error:",
            e
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500