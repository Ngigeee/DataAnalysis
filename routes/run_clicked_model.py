from flask import Blueprint, jsonify, request, session

import os
import json
import joblib
import pandas as pd
import numpy as np

from routes.config import get_db


run_clicked_model_bp = Blueprint(
    "run_clicked_model_bp",
    __name__
)

@run_clicked_model_bp.route(
    "/view_clicked_model/<int:model_id>/run",
    methods=["POST"]
)
def run_clicked_model(model_id):

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
        # GET MODEL FROM DATABASE
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
        # MODEL NOT FOUND
        # ====================================================

        if model is None:

            return jsonify({
                "success": False,
                "error": "Model not found."
            }), 404


        # ====================================================
        # GET REQUEST DATA
        # ====================================================

        values = request.get_json(
            silent=True
        )

        if not isinstance(values, dict):

            return jsonify({
                "success": False,
                "error": "No prediction values were provided."
            }), 400


        # ====================================================
        # GET FEATURES
        # ====================================================

        features = model.get("features")


        if isinstance(features, str):

            try:

                features = json.loads(features)

            except Exception:

                features = [
                    x.strip()
                    for x in features.split(",")
                    if x.strip()
                ]


        if not isinstance(features, list):

            features = []


        if not features:

            return jsonify({
                "success": False,
                "error": "This model has no features configured."
            }), 400


        # ====================================================
        # CHECK REQUIRED FEATURES
        # ====================================================

        missing_features = [
            feature
            for feature in features
            if feature not in values
        ]


        if missing_features:

            return jsonify({

                "success": False,

                "error":
                    "Missing required features.",

                "missing":
                    missing_features

            }), 400


        # ====================================================
        # GET MODEL FILE
        # ====================================================

        model_path = model.get("file_path")


        if not model_path:

            return jsonify({

                "success": False,

                "error":
                    "Model file path is missing."

            }), 500


        if os.path.isabs(model_path):

            full_model_path = model_path

        else:

            full_model_path = os.path.join(
                os.getcwd(),
                model_path
            )


        full_model_path = os.path.abspath(
            full_model_path
        )


        print("=" * 70)
        print("MODEL ID:", model_id)
        print("MODEL FILE:", full_model_path)
        print("=" * 70)


        if not os.path.isfile(full_model_path):

            return jsonify({

                "success": False,

                "error":
                    "Model file was not found.",

                "path":
                    full_model_path

            }), 404


        loaded_model = joblib.load(
            full_model_path
        )


        print(
            "Loaded object type:",
            type(loaded_model)
        )

        trained_model = None


        if hasattr(
            loaded_model,
            "predict"
        ):

            trained_model = loaded_model


        elif isinstance(
            loaded_model,
            dict
        ):

            print(
                "Saved dictionary keys:",
                list(loaded_model.keys())
            )


            # YOUR ACTUAL SAVED STRUCTURE
            if hasattr(
                loaded_model.get(
                    "model_object"
                ),
                "predict"
            ):

                trained_model = (
                    loaded_model["model_object"]
                )


            # Other possible structures
            if trained_model is None:

                possible_keys = ["model","trained_model","estimator","pipeline","classifier","regressor"]


                for key in possible_keys:

                    candidate = (
                        loaded_model.get(key)
                    )


                    if hasattr(
                        candidate,
                        "predict"
                    ):

                        trained_model = candidate

                        break


        if trained_model is None:

            return jsonify({

                "success": False,

                "error":
                    "The saved file does not contain a usable prediction model.",

                "loaded_type":
                    type(
                        loaded_model
                    ).__name__

            }), 500


        print(
            "Actual prediction model:",
            type(trained_model)
        )


        input_data = {}


        for feature in features:

            value = values.get(feature)


            if ( value is None or str(value).strip() == ""):

                return jsonify({

                    "success": False,

                    "error":
                        f"Value for '{feature}' is required."

                }), 400


            input_data[
                feature
            ] = value


        input_df = pd.DataFrame(
            [input_data],
            columns=features
        )

        for column in input_df.columns:

            value = input_df[column].iloc[0]


            numeric_value = pd.to_numeric(
                value,
                errors="coerce"
            )


            if pd.notna(
                numeric_value
            ):

                input_df[column] = (
                    input_df[column]
                    .astype(float)
                )
        print( "Prediction input:")
        print( input_df)

        prediction = trained_model.predict( input_df)

        if prediction is None:

            return jsonify({

                "success": False,

                "error":
                    "Model returned no prediction."

            }), 500


        if len(prediction) == 0:

            return jsonify({

                "success": False,

                "error":
                    "Model returned no prediction."

            }), 500


        result = prediction[0]


        if isinstance(result, np.ndarray):

             result = result.tolist()

        elif isinstance(
             result,
             (
                np.integer,
                np.floating
             )
        ):
             result = result.item()
              
        elif isinstance(result, pd.Timestamp):

             result = result.isoformat()
        

        if isinstance(result, (int, float)) and not isinstance(result, bool):

            result = round(float(result), 2)

        return jsonify({

            "success":
                True,

            "model_id":
                model["id"],

            "model_name":
                model["name"],

            "model_type":
                model["model_type"],

            "target":
                model["target"],

            "prediction":
                result

        })


    except Exception as e:

        print("=" * 70)
        print(
            "RUN MODEL ERROR:",
            repr(e)
        )
        print("=" * 70)


        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500