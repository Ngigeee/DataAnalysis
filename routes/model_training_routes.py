from flask import Blueprint, request, jsonify, session
import os
import json
import uuid
import joblib
import pandas as pd

model_training_bp = Blueprint(
    "model_training",
    __name__
)

# --------------------------------------------------
# RUN MODEL
# --------------------------------------------------
#save model


@model_training_bp.route("/save_model", methods=["POST"])
def save_model():
    data = request.get_json()
    model_type = data.get("model_type")
    target = data.get("target")

    if not model_type or not target:
        return jsonify({
            "success": False,
            "error": "Model type and target are required."
        }), 400

    cache_key = f"{model_type}_{target}"
    cached_package = RUNNED_MODELS_CACHE.get(cache_key)

    if not cached_package:
        return jsonify({
            "success": False, 
            "error": "No model found in memory. Please run the model first."
        }), 400

    # 1. Determine logged-in user (owner) or guest
    user_id = None
    if "user" in session:
        user_id = session["user"]["id"]

    # 2. Save file to disk using joblib (using uuid to prevent name collisions across models)
    filename = f"{model_type}_{target}_{uuid.uuid4().hex[:8]}.pkl"
    filepath = os.path.join(MODEL_DIR, filename)
    
    try:
        joblib.dump(cached_package, filepath)

        # 3. Extract metrics dynamically (works for regression, classification, etc.)
        # If your cached package has a "metrics" dict, store it as JSON string
        metrics_data = cached_package.get("metrics", {})
        
        # Fallback if metrics are stored flatly in the package
        if not metrics_data:
            metrics_data = {
                k: v for k, v in cached_package.items() 
                if k not in ["model_object", "model_type", "features", "target", "predictions"]
            }

        # 4. Insert universal details and owner info into the database
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO saved_models
            (
                user_id,
                model_type,
                target,
                features,
                file_path,
                metrics
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                model_type,
                target,
                json.dumps(cached_package.get("features", [])),
                filepath,
                json.dumps(metrics_data)
            )
        )

        model_db_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "message": f"Model saved successfully as {filename} and logged to database!",
            "model_id": model_db_id
        })

    except Exception as e:
        # Clean up file if database insertion fails
        if os.path.exists(filepath):
            os.remove(filepath)
            
        print("Save model error:", str(e))
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

#run linear models
@model_training_bp.route("/run_model", methods=["POST"])
def run_model():

    try:

        # -------------------------
        # GET DATA FROM FRONTEND
        # -------------------------

        data = request.get_json()

        model_type = data.get("model_type")

        features = data.get("features", [])

        target = data.get("target")

        test_size = data.get("test_size", 0.2)

        random_state = data.get("random_state", 42)


        # -------------------------
        # VALIDATION
        # -------------------------

        if not model_type:

            return jsonify({
                "success": False,
                "error": "No model type specified."
            }), 400


        if not features:

            return jsonify({
                "success": False,
                "error": "No features selected."
            }), 400


        if not target:

            return jsonify({
                "success": False,
                "error": "No target selected."
            }), 400


        if target in features:

            return jsonify({
                "success": False,
                "error":
                    "Target cannot also be a feature."
            }), 400


        # -------------------------
        # GET ACTIVE DATAFRAME
        # -------------------------

        active_data = get_active_dataframe()


        if active_data is None:

            return jsonify({
                "success": False,
                "error":
                    "No active dataset selected."
            }), 400


        # -------------------------
        # GET ACTUAL DATAFRAME
        # -------------------------

        if isinstance(active_data, tuple):

            df = active_data[0]

        else:

            df = active_data


        if not isinstance(df, pd.DataFrame):

            return jsonify({
                "success": False,
                "error":
                    "Active dataset is not a valid DataFrame."
            }), 400


        # -------------------------
        # CHECK COLUMNS
        # -------------------------

        required_columns = (
            features + [target]
        )


        missing_columns = [

            column

            for column in required_columns

            if column not in df.columns

        ]


        if missing_columns:

            return jsonify({

                "success": False,

                "error":
                    "Columns not found: "
                    + ", ".join(missing_columns)

            }), 400


        # -------------------------
        # GET ACTUAL COLUMN DATA
        # -------------------------

        X = df[features]

        y = df[target]


        # -------------------------
        # MODEL DISPATCHER
        # -------------------------

        if model_type == "linear_regression":

            result = linearRegression(

                df,

                features,

                target,

                test_size,

                random_state

            )


        elif model_type == "logistic_regression":

            result = logisticRegression(

                df,

                features,

                target,

                test_size,

                random_state

            )


        elif model_type == "decision_tree":

            result = decisionTree(

                df,

                features,

                target,

                test_size,

                random_state

            )


        elif model_type == "random_forest":

            result = randomForest(

                df,

                features,

                target,

                test_size,

                random_state

            )


        else:

            return jsonify({

                "success": False,

                "error":
                    f"Unsupported model type: {model_type}"

            }), 400


        # -------------------------
        # RETURN RESULT & SAVE MODEL
        # -------------------------

        if "model_object" in result:
            model_obj = result["model_object"]

            # 1. Save the model object to disk using joblib
            filename = f"{model_type}_{target}.joblib"
            file_path = os.path.join("saved_models", filename)
            os.makedirs("saved_models", exist_ok=True)
            joblib.dump(model_obj, file_path)

            # 2. Enter details into your Database
            # new_entry = ModelLog(
            #     model_name=result.get("model", model_type),
            #     target=target,
            #     features=str(features),
            #     r2_score=result.get("r2_score"),
            #     mse=result.get("mse"),
            #     file_path=file_path
            # )
            # db.session.add(new_entry)
            # db.session.commit()

            # 3. Cache the model object for fast runtime lookups/predictions
            cache_key = f"{model_type}_{target}"
            RUNNED_MODELS_CACHE[cache_key] = {
                "model_object": model_obj,
                "model_type": model_type,
                "features": features,
                "target": target,
                "file_path": file_path
            }

        # 4. Pop the model object so Flask JSON encoder doesn't crash
        result.pop("model_object", None)

        return jsonify({

            "success": True,

            **result

        })


    except Exception as e:

        print(
            "Model error:",
            str(e)
        )

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500
