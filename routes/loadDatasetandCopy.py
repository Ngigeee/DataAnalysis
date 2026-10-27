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

loadDataset_bp = Blueprint("loadDataset", __name__)


@loadDataset_bp.route("/datasets/<int:item_id>")
@loadDataset_bp.route("/datasets/<int:item_id>/<string:item_type>")
def load_dataset(item_id, item_type="dataset"):

    try:
        print("========== LOAD DATASET ==========")
        print("COOKIES:", request.cookies)
        print("SESSION:", dict(session))

        if "user" not in session or session["user"] is None:
            return jsonify({
                "success": False,
                "error": "Not authenticated"
            }), 401

        user_id = session["user"]["id"]

        print("USER ID:", user_id)

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # ============================
        # LOAD A COPY
        # ============================

        if item_type == "copy":

            cursor.execute(
                """
                SELECT *
                FROM dataframe_copies
                WHERE id=%s
                """,
                (item_id,)
            )

            copy = cursor.fetchone()

            if copy is None:

                cursor.close()
                conn.close()

                return jsonify({
                    "success": False,
                    "error": "Copy not found"
                }), 404

            with open(copy["file_path"], "r", encoding="utf-8") as f:
                data = json.load(f)

            session["active_dataset_id"] = copy["owner_dataframe_id"]
            session["active_copy_id"] = copy["id"]

            cursor.close()
            conn.close()

            return jsonify({
                "success": True,
                "name": copy["name"],
                "data": data
            })


        # ============================
        # LOAD ORIGINAL DATASET
        # ============================

        cursor.execute(
            """
            SELECT *
            FROM datasets
            WHERE id=%s
            """,
            (item_id,)
        )

        dataset = cursor.fetchone()

        cursor.close()
        conn.close()

        if dataset is None:

            return jsonify({
                "success": False,
                "error": "Dataset not found"
            }), 404


        # Read dataset into pandas
        if dataset["file_type"] == "csv":
            df = pd.read_csv(dataset["file_path"])
        else:
            df = pd.read_json(dataset["file_path"])


        # ====================================
        # Prepare JSON-safe copy for frontend
        # ====================================

        frontend_df = (
            df.astype(object)
              .replace([np.nan, np.inf, -np.inf], None)
              .where(pd.notnull(df), None)
        )


        # Save active dataset in session
        session["active_dataset_id"] = dataset["id"]
        session.pop("active_copy_id", None)


        return jsonify({
            "success": True,
            "name": dataset["original_name"],
            "rows": len(df),
            "columns": list(df.columns),
            "data": frontend_df.to_dict(orient="records")
        })

    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
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









