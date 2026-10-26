
from flask import Blueprint, jsonify, request
import pandas as pd

# Import these from the module where they are defined.
from routes.loadActiveDataset import (
    get_active_dataframe,
    save_active_dataframe
)

data_cleaning_bp = Blueprint(
    "data_cleaning",
    __name__
)


# --------------------------------------------------
# DUPLICATES
# --------------------------------------------------
@data_cleaning_bp.route("/duplicates")
def duplicates():

    df, _ = get_active_dataframe()

    duplicate_rows = df[df.duplicated()]

    return jsonify(
        duplicate_rows.fillna("").to_dict(orient="records")
    )


# --------------------------------------------------
# MISSING VALUES
# --------------------------------------------------
@data_cleaning_bp.route("/missing")
def missing():

    df, _ = get_active_dataframe()

    result = df.isnull().sum().to_dict()

    return jsonify(result)


# --------------------------------------------------
# REMOVE DUPLICATES
# --------------------------------------------------
@data_cleaning_bp.route("/remove_duplicates", methods=["POST"])
def remove_duplicates():

    df, _ = get_active_dataframe()

    before = len(df)

    df.drop_duplicates(inplace=True)

    save_active_dataframe(df)

    removed = before - len(df)

    return jsonify({
        "removed": int(removed),
        "rows": len(df)
    })


# --------------------------------------------------
# DROP MISSING ROWS
# --------------------------------------------------
@data_cleaning_bp.route("/drop_missing", methods=["POST"])
def drop_missing():

    df, _ = get_active_dataframe()

    before = len(df)

    df.dropna(inplace=True)

    save_active_dataframe(df)

    removed = before - len(df)

    return jsonify({
        "removed": int(removed),
        "rows": len(df)
    })


# --------------------------------------------------
# FILL MISSING VALUES
# --------------------------------------------------
@data_cleaning_bp.route("/fill_missing", methods=["POST"])
def fill_missing():

    df, _ = get_active_dataframe()

    data = request.get_json(silent=True) or {}
    method = data.get("method")

    if method not in ("mean", "median", "mode"):
        return jsonify({
            "error": "Method must be mean, median, or mode."
        }), 400

    for col in df.columns:

        if method in ("mean", "median"):

            # Only process numeric columns
            if pd.api.types.is_numeric_dtype(df[col]):

                if method == "mean":
                    value = df[col].mean()
                else:
                    value = df[col].median()

                if pd.notna(value):
                    df[col] = df[col].fillna(value)

        elif method == "mode":

            # Use the most frequent non-null value
            modes = df[col].mode()

            if not modes.empty:
                df[col] = df[col].fillna(modes.iloc[0])

    save_active_dataframe(df)

    return jsonify({
        "message": "Missing values filled",
        "method": method
    })


# --------------------------------------------------
# NORMALIZE COLUMN
# --------------------------------------------------
@data_cleaning_bp.route("/normalize", methods=["POST"])
def normalize():

    df, _ = get_active_dataframe()

    data = request.get_json(silent=True) or {}
    col = data.get("column")

    if not col or col not in df.columns:
        return jsonify({
            "error": "A valid column is required."
        }), 400

    if not pd.api.types.is_numeric_dtype(df[col]):
        return jsonify({
            "error": "Only numeric columns can be normalized."
        }), 400

    min_value = df[col].min()
    max_value = df[col].max()

    if pd.isna(min_value) or pd.isna(max_value):
        return jsonify({
            "error": "Column has no valid numeric values."
        }), 400

    if max_value == min_value:
        # Avoid division by zero for constant columns
        df[col] = df[col].where(df[col].isna(), 0.0)
    else:
        df[col] = (
            (df[col] - min_value) /
            (max_value - min_value)
        )

    save_active_dataframe(df)

    return jsonify({
        "message": "Column normalized",
        "column": col
    })
