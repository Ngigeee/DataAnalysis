
from flask import Blueprint, jsonify, session

import json

from routes.config import get_db


dashboard_model_details_bp = Blueprint(
    "dashboard_model_details_bp",
    __name__
)
@dashboard_model_details_bp.route("/view_clicked_model_page/<int:model_id>/data")
def view_model_details(model_id):

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
        # FIND MODEL BELONGING TO LOGGED-IN USER
        # ==========================================

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                model_type,
                name,
                target,
                features,
                file_path,
                metrics,
                created_at
            FROM saved_models
            WHERE id = %s
              AND user_id = %s
            """,
            (
                model_id,
                user_id
            )
        )

        model = cursor.fetchone()


        cursor.close()
        conn.close()


        # ==========================================
        # MODEL NOT FOUND OR DOES NOT BELONG
        # TO THIS USER
        # ==========================================

        if model is None:

            return jsonify({
                "success": False,
                "error": "Model not found"
            }), 404


        # ==========================================
        # DECODE FEATURES
        # ==========================================

        try:

            features = json.loads(
                model["features"]
            )

        except (
            json.JSONDecodeError,
            TypeError
        ):

            features = []


        # ==========================================
        # DECODE METRICS
        # ==========================================

        try:

            metrics = (
                json.loads(model["metrics"])
                if model["metrics"]
                else {}
            )

        except (
            json.JSONDecodeError,
            TypeError
        ):

            metrics = {}


        # ==========================================
        # FORMAT CREATED DATE
        # ==========================================

        created_at = model["created_at"]

        if created_at:

            created_at = created_at.strftime(
                "%Y-%m-%d %H:%M:%S"
            )


        # ==========================================
        # RETURN MODEL DETAILS
        #
        # NO SESSION CHANGES
        # ==========================================

        return jsonify({

            "success": True,

            "model": {

                "id":
                    model["id"],

                "name":
                    model["name"]
                    or "Unnamed Model",

                "model_type":
                    model["model_type"],

                "target":
                    model["target"],

                "created_at":
                    created_at

            },

            "features":
                features,

            "metrics":
                metrics

        })


    except Exception as e:

        print(
            "View model error:",
            e
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500