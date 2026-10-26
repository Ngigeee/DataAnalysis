# export_visualization_routes.py

from flask import Blueprint, jsonify, Response

from routes.loadActiveDataset import get_active_dataframe


# --------------------------------------------------
# BLUEPRINT
# --------------------------------------------------
export_visualization_bp = Blueprint(
    "export_visualization",
    __name__
)


# --------------------------------------------------
# EXPORT CSV
# --------------------------------------------------
@export_visualization_bp.route("/export")
def export():

    df, _ = get_active_dataframe()

    return df.to_csv(index=False)


# --------------------------------------------------
# VISUALIZATION
# --------------------------------------------------
@export_visualization_bp.route("/visualize/<chart>")
def visualize(chart):

    df, _ = get_active_dataframe()

    return jsonify({
        "message": f"Generate {chart} chart here",
        "rows": len(df),
        "columns": list(df.columns)
    })


# --------------------------------------------------
# MACHINE LEARNING
# --------------------------------------------------
@export_visualization_bp.route("/model/<model>", methods=["POST"])
def model(model):

    df, _ = get_active_dataframe()

    return jsonify({
        "message": f"Run {model} model here",
        "rows": len(df),
        "columns": list(df.columns)
    })