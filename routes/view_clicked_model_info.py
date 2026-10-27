from flask import Blueprint, jsonify, request, session

import os
import json
import joblib
import pandas as pd
import numpy as np

from routes.config import get_db


view_clicked_model_info_bp = Blueprint(
    "view_clicked_model_info_bp",
    __name__
)
@view_clicked_model_info_bp .route(
    "/get_clicked_model/<int:model_id>/data",
    methods=["GET"]
)
def view_clicked_model_data(model_id):

    try:

        # ====================================================
        # CHECK LOGIN
        # ====================================================

        if "user" not in session:

            return jsonify({
                "success": False,
                "error": "Please log in."
            }), 401


        user_id = session["user"]["id"]


        # ====================================================
        # GET MODEL
        # ====================================================

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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
            LIMIT 1
            """,
            (
                model_id,
                user_id
            )
        )

        model = cursor.fetchone()

        cursor.close()
        conn.close()


        # ====================================================
        # SECURITY
        # ====================================================

        if model is None:

            return jsonify({
                "success": False,
                "error": "Model not found."
            }), 404


        # ====================================================
        # FEATURES
        # ====================================================

        features = model.get("features")


        if isinstance(features, str):

            try:

                features = json.loads(
                    features
                )

            except Exception:

                features = [
                    x.strip()
                    for x in features.split(",")
                    if x.strip()
                ]


        if not isinstance(features, list):

            features = []


        # ====================================================
        # METRICS
        # ====================================================

        metrics = model.get("metrics")


        if isinstance(metrics, str):

            try:

                metrics = json.loads(
                    metrics
                )

            except Exception:

                metrics = {}


        if not isinstance(metrics, dict):

            metrics = {}


        # ====================================================
        # IMPORTANT
        #
        # Do NOT use metrics["file_path"] as the model path.
        #
        # The real path is:
        #
        # saved_models.file_path
        # ====================================================

        return jsonify({

            "success": True,

            "model": {

                "id":
                    model["id"],

                "user_id":
                    model["user_id"],

                "model_type":
                    model["model_type"],

                "name":
                    model["name"],

                "target":
                    model["target"],

                "file_path":
                    model["file_path"],

                "created_at":
                    str(model["created_at"])

            },

            "features":
                features,

            "metrics":
                metrics

        })


    except Exception as e:

        print(
            "View clicked model error:",
            repr(e)
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500