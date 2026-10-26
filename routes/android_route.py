from flask import (
    Blueprint,
    jsonify,
    session,
    redirect,
    url_for,
    request
)
from .config import get_db
import pandas as pd
import numpy as np
import json
import os
import joblib
import numpy as np
import pandas as pd

android_routes = Blueprint("androidRoutes", __name__)

ANDROID_APP_TOKEN="MYAPPTOKEN"

@android_routes.route("/android/login", methods=["POST"])
def android_login():

    try:
        token=request.headers.get("X-Android-App-Token")
        if token is None:
            return jsonify({
                "success":False,
                "message":"App token missing"
            }),401
        if token != ANDROID_APP_TOKEN:
            return jsonify({
                "success":False,
                "message":"inalid token "
            }),403

        data=request.get_json()

        email=data.get("username")
        password=data.get("password")

        if email is None:
            return jsonify({
                "success":False,
                "message":" please input email"
            }),403
        if password is None:
            return jsonify({
                "success":False,
                "message":" please input password "
            }),403


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
            FROM users
            WHERE email = %s
            """,
            (
                email,
            )
        )

        user = cursor.fetchone()


        cursor.close()
        conn.close()

        if not user:

            return jsonify({
                "success": False,
                "error": "User not registered"
            })

        if not check_password_hash(
            user["password"],
            password
        ):

            return jsonify({
                "success": False,
                "error": "Invalid password"
            })
        if user["verified"] != 1:

            return jsonify({
                "success": False,
                "error": "Account not verified. Please verify your account first."
            })
        # CREATE SESSION WITH USER PREFERENCES

        session["user"] = {
            "id": user["id"],
            "username": user["username"],
            "theme": user["theme"]
        }

         return jsonify({

            "success": True,
            "redirect": url_for("home"),
            "loggedin_id": user["user_id"],
            "username": user["username"],
            "is_premium": user["is_premium"],
            "verified": user["verified"],
            "email": user["email"],
            "created_at": user["created_at"],
            "theme": user["theme"],
            can i return the session token

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



#view clicked dataset copy in profile page

@android_routes.route("/view_clicked_copy/<int:copy_id>")
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

@android_routes.route("/view_clicked_model_page/<int:model_id>/data")
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
@android_routes.route(
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


# ============================================================
# RUN MODEL
# ============================================================

# ============================================================
# RUN SAVED MODEL
# ============================================================

# ============================================================
# RUN SAVED MODEL
# ============================================================
@android_routes.route(
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


        # ====================================================
        # BUILD ABSOLUTE PATH
        # ====================================================

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


        # ====================================================
        # CHECK FILE
        # ====================================================

        if not os.path.isfile(full_model_path):

            return jsonify({

                "success": False,

                "error":
                    "Model file was not found.",

                "path":
                    full_model_path

            }), 404


        # ====================================================
        # LOAD SAVED FILE
        # ====================================================

        loaded_model = joblib.load(
            full_model_path
        )


        print(
            "Loaded object type:",
            type(loaded_model)
        )


        # ====================================================
        # EXTRACT ACTUAL SKLEARN MODEL
        # ====================================================

        trained_model = None


        # ----------------------------------------------------
        # CASE 1:
        # File directly contains sklearn model
        # ----------------------------------------------------

        if hasattr(
            loaded_model,
            "predict"
        ):

            trained_model = loaded_model


        # ----------------------------------------------------
        # CASE 2:
        # File contains dictionary
        # ----------------------------------------------------

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

                possible_keys = [

                    "model",

                    "trained_model",

                    "estimator",

                    "pipeline",

                    "classifier",

                    "regressor"

                ]


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


        # ====================================================
        # VERIFY MODEL
        # ====================================================

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


        # ====================================================
        # BUILD INPUT DATA
        # ====================================================

        input_data = {}


        for feature in features:

            value = values.get(
                feature
            )


            if (
                value is None
                or str(value).strip() == ""
            ):

                return jsonify({

                    "success": False,

                    "error":
                        f"Value for '{feature}' is required."

                }), 400


            input_data[
                feature
            ] = value


        # ====================================================
        # CREATE DATAFRAME
        # ====================================================

        input_df = pd.DataFrame(
            [input_data],
            columns=features
        )


        # ====================================================
        # CONVERT NUMERIC VALUES
        # ====================================================

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


        print(
            "Prediction input:"
        )

        print(
            input_df
        )


        # ====================================================
        # RUN PREDICTION
        # ====================================================

        prediction = trained_model.predict(
            input_df
        )


        # ====================================================
        # CHECK RESULT
        # ====================================================

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


        # ====================================================
        # CONVERT RESULT TO JSON SAFE VALUE
        # ====================================================

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
        
       # ====================================================
       # ROUND NUMERIC PREDICTIONS TO 2 DECIMAL PLACES
       # ====================================================

        if isinstance(result, (int, float)) and not isinstance(result, bool):

            result = round(float(result), 2)

        # ====================================================
        # RETURN RESULT
        # ====================================================

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

# ============================================================
# VIEW GENERATED PYTHON CODE FOR SAVED MODEL
# ============================================================
@android_routes.route(
    "/view_clicked_model/<int:model_id>/code",
    methods=["GET"]
)
def view_clicked_model_code(model_id):

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
        # SECURITY CHECK
        # ====================================================

        if model is None:

            return jsonify({
                "success": False,
                "error": "Model not found."
            }), 404


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
        # GET METRICS
        # ====================================================

        metrics = model.get("metrics")


        if isinstance(metrics, str):

            try:

                metrics = json.loads(metrics)

            except Exception:

                metrics = {}


        if not isinstance(metrics, dict):

            metrics = {}


        # ====================================================
        # GENERATE CODE
        # ====================================================

        code = generate_model_code(
            model,
            features,
            metrics
        )


        # ====================================================
        # RETURN CODE
        # ====================================================

        return jsonify({

            "success": True,

            "model_id":
                model["id"],

            "model_name":
                model["name"]
                or "Unnamed Model",

            "code":
                code

        })


    except Exception as e:

        print(
            "View model code error:",
            repr(e)
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500


# ============================================================
# GENERATE PYTHON CODE FOR MODEL
# ============================================================

def generate_model_code(
    model,
    features,
    metrics
):

    # --------------------------------------------------------
    # MODEL INFORMATION
    # --------------------------------------------------------

    model_type = (
        model.get("model_type")
        or "unknown"
    )

    target = (
        model.get("target")
        or "target"
    )

    model_name = (
        model.get("name")
        or "Saved Model"
    )

    file_path = (
        model.get("file_path")
        or "model.joblib"
    )


    # --------------------------------------------------------
    # FEATURE REPRESENTATION
    # --------------------------------------------------------

    feature_repr = repr(features)


    # --------------------------------------------------------
    # BASE CODE
    # --------------------------------------------------------

    code = f'''# ============================================================
# Kijarney Saved Model
# ============================================================

import joblib
import pandas as pd


# ============================================================
# MODEL INFORMATION
# ============================================================

model_name = {model_name!r}
model_type = {model_type!r}
target = {target!r}


# ============================================================
# FEATURES USED DURING TRAINING
# ============================================================

features = {feature_repr}


# ============================================================
# LOAD SAVED MODEL
# ============================================================

loaded_model = joblib.load(
    {file_path!r}
)


# ============================================================
# EXTRACT TRAINED MODEL
# ============================================================

if isinstance(loaded_model, dict):

    model = loaded_model.get("model_object")

else:

    model = loaded_model


# ============================================================
# VERIFY MODEL
# ============================================================

if model is None:

    raise ValueError(
        "The saved file does not contain a model_object."
    )


if not hasattr(model, "predict"):

    raise ValueError(
        "The loaded object does not support prediction."
    )


# ============================================================
# INPUT DATA
# ============================================================

input_data = {{
'''


    # --------------------------------------------------------
    # ADD FEATURE INPUTS
    # --------------------------------------------------------

    for feature in features:

        code += (
            f"    {feature!r}: [0],\n"
        )


    # --------------------------------------------------------
    # COMPLETE CODE
    # --------------------------------------------------------

    code += '''}


# ============================================================
# CREATE DATAFRAME
# ============================================================

df = pd.DataFrame(
    input_data,
    columns=features
)


# ============================================================
# MAKE PREDICTION
# ============================================================

prediction = model.predict(
    df
)


# ============================================================
# DISPLAY RESULT
# ============================================================

print(
    "Predicted {target}:",
    prediction[0]
)
'''


    return code









