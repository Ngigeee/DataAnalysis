
from flask import Blueprint, jsonify
import io

from routes.loadActiveDataset import get_active_dataframe

# Create Blueprint
dataset_analysis_bp = Blueprint(
    "dataset_analysis",
    __name__
)


# --------------------------------------------------
# GET DATASET
# --------------------------------------------------

@dataset_analysis_bp.route("/dataset")
def dataset():

    try:
        df, _ = get_active_dataframe()

        # Send only the first 500 rows
        display_df = df.head(500).copy()

        # Handle missing values
        display_df = display_df.fillna("")

        return jsonify(
            display_df.to_dict(orient="records")
        )

    except Exception as e:
        print("Dataset error:", e)

        return jsonify({
            "error": "Unable to load dataset."
        }), 500


# --------------------------------------------------
# HEAD
# --------------------------------------------------
@dataset_analysis_bp.route("/head")
def head():

    df, _ = get_active_dataframe()

    return jsonify(
        df.head().fillna("").to_dict(orient="records")
    )


# --------------------------------------------------
# TAIL
# --------------------------------------------------
@dataset_analysis_bp.route("/tail")
def tail():

    df, _ = get_active_dataframe()

    return jsonify(
        df.tail().fillna("").to_dict(orient="records")
    )


# --------------------------------------------------
# SHAPE
# --------------------------------------------------
@dataset_analysis_bp.route("/shape")
def shape():

    df, _ = get_active_dataframe()

    return jsonify({
        "rows": df.shape[0],
        "columns": df.shape[1]
    })


# --------------------------------------------------
# COLUMNS
# --------------------------------------------------
@dataset_analysis_bp.route("/columns")
def columns():

    df, _ = get_active_dataframe()

    return jsonify(list(df.columns))


# --------------------------------------------------
# DTYPES
# --------------------------------------------------
@dataset_analysis_bp.route("/dtypes")
def dtypes():

    df, _ = get_active_dataframe()

    return jsonify(
        df.dtypes.astype(str).to_dict()
    )


# --------------------------------------------------
# INFO
# --------------------------------------------------
@dataset_analysis_bp.route("/info")
def info():

    df, _ = get_active_dataframe()

    buffer = io.StringIO()
    df.info(buf=buffer)

    return jsonify({
        "info": buffer.getvalue()
    })


# --------------------------------------------------
# DESCRIBE
# --------------------------------------------------
@dataset_analysis_bp.route("/describe")
def describe():

    df, _ = get_active_dataframe()

    return jsonify(
        df.describe(include="all")
        .fillna("")
        .T
        .reset_index()
        .rename(columns={"index": "Column"})
        .to_dict(orient="records")
    )
