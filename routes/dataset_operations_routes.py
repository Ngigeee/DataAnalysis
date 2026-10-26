from flask import Blueprint, request, jsonify, session
import os
import uuid
import numpy as np
import pandas as pd

from routes.loadActiveDataset import (
    get_active_dataframe,
    save_active_dataframe
)
from routes.shared_state import (
    RUNNED_MODELS_CACHE,
    UPLOAD_FOLDER
)

from routes.config import get_db


# --------------------------------------------------
# BLUEPRINT
# --------------------------------------------------
dataset_operations_bp = Blueprint(
    "dataset_operations",
    __name__
)


# --------------------------------------------------
# ACTIVE DATAFRAME
# --------------------------------------------------
@dataset_operations_bp.route("/active_dataframe")
def active_dataframe():

    try:

        # CLEAR MODEL CACHE WHEN DATASET IS LOADED
        RUNNED_MODELS_CACHE.clear()

        # LOAD FULL DATAFRAME
        df, dataset_name = get_active_dataframe()

        # TOTAL DATASET INFORMATION
        total_rows = len(df)
        total_columns = len(df.columns)

        # ONLY SEND ROWS NEEDED FOR DISPLAY
        display_df = df.head(500).copy()

        # HANDLE NULL / INVALID VALUES
        display_df = display_df.replace(
            [np.nan, np.inf, -np.inf],
            None
        )

        # RETURN DATA
        return jsonify({
            "success": True,
            "name": dataset_name,
            "data": display_df.to_dict(orient="records"),
            "columns": list(df.columns),
            "total_rows": total_rows,
            "total_columns": total_columns
        })

    except Exception as e:

        # NO ACTIVE DATASET
        if str(e) == "No active dataset selected.":

            return jsonify({
                "success": False,
                "message": (
                    "No dataset selected. "
                    "Upload or select a dataset "
                    "to get started."
                ),
                "data": []
            }), 200

        # OTHER ERRORS
        print("Active dataframe error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to load the dataset.",
            "data": []
        }), 500


# --------------------------------------------------
# UPDATE CELL
# --------------------------------------------------
@dataset_operations_bp.route("/update_cell", methods=["POST"])
def update_cell():

    data = request.get_json()

    row = int(data["row"])
    column = data["column"]
    value = data["value"]

    df, _ = get_active_dataframe()

    dtype = df[column].dtype

    try:

        if pd.api.types.is_integer_dtype(dtype):
            value = None if value == "" else int(value)

        elif pd.api.types.is_float_dtype(dtype):
            value = None if value == "" else float(value)

        elif pd.api.types.is_bool_dtype(dtype):
            value = str(value).lower() in ("true", "1", "yes")

        else:
            value = str(value)

    except ValueError:

        return jsonify({
            "success": False,
            "message": f"'{value}' is not a valid {dtype}"
        }), 400

    df.at[row, column] = value

    save_active_dataframe(df)

    return jsonify({
        "success": True
    })


# --------------------------------------------------
# UPLOAD DATASET
# --------------------------------------------------
@dataset_operations_bp.route("/upload", methods=["POST"])
def upload():

    # CLEAR MODEL CACHE WHEN A NEW DATASET IS LOADED
    RUNNED_MODELS_CACHE.clear()

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in [".csv", ".json"]:
        return jsonify({
            "error": "Unsupported file type"
        }), 400

    # CREATE DATASETS FOLDER
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

    # GENERATE UNIQUE FILENAME
    stored_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_FOLDER, stored_name)

    try:

        # SAVE UPLOADED FILE
        file.save(file_path)

        # LOAD INTO PANDAS
        if ext == ".csv":

            df = pd.read_csv(
                file_path,
                encoding="utf-8",
                on_bad_lines="warn"
            )

        else:

            df = pd.read_json(
                file_path,
                encoding="utf-8"
            )

        # LOGGED-IN USER OR GUEST
        user_id = None

        if "user" in session:
            user_id = session["user"]["id"]

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO datasets
            (
                user_id,
                original_name,
                stored_name,
                file_path,
                file_type,
                row_count,
                column_count,
                file_size
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                file.filename,
                stored_name,
                file_path,
                ext.lstrip("."),
                len(df),
                len(df.columns),
                os.path.getsize(file_path)
            )
        )

        dataset_id = cursor.lastrowid

        # SESSION FOR ACTIVE DATASET
        session["active_dataset_id"] = dataset_id

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "dataset_id": dataset_id,
            "dataset_name": file.filename,
            "rows": len(df),
            "columns": list(df.columns)
        })

    except Exception as e:

        # REMOVE UPLOADED FILE IF SOMETHING FAILED
        if os.path.exists(file_path):
            os.remove(file_path)

        print("UPLOAD ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500