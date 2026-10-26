
from flask import Blueprint, jsonify, request

from routes.loadActiveDataset import (
    get_active_dataframe,
    save_active_dataframe
)

dataset_structure_bp = Blueprint(
    "dataset_structure",
    __name__
)


# --------------------------------------------------
# ADD COLUMN
# --------------------------------------------------
@dataset_structure_bp.route("/add_column", methods=["POST"])
def add_column():
    try:
        data = request.get_json(silent=True) or {}

        column = data.get("column")
        default = data.get("default", "")

        if not isinstance(column, str) or not column.strip():
            return jsonify({
                "success": False,
                "message": "Column name required"
            }), 400

        column = column.strip()

        df, _ = get_active_dataframe()

        if column in df.columns:
            return jsonify({
                "success": False,
                "message": "Column already exists"
            }), 409

        df[column] = default

        save_active_dataframe(df)

        return jsonify({
            "success": True,
            "message": "Column added"
        })

    except Exception as e:
        print("ADD COLUMN ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Unable to add column"
        }), 500


# --------------------------------------------------
# DROP COLUMN
# --------------------------------------------------
@dataset_structure_bp.route("/drop_column", methods=["POST"])
def drop_column():
    try:
        data = request.get_json(silent=True) or {}
        column = data.get("column")

        if not isinstance(column, str) or not column.strip():
            return jsonify({
                "success": False,
                "message": "Column name required"
            }), 400

        df, _ = get_active_dataframe()

        if column not in df.columns:
            return jsonify({
                "success": False,
                "message": "Column does not exist"
            }), 404

        df.drop(columns=[column], inplace=True)

        save_active_dataframe(df)

        return jsonify({
            "success": True,
            "message": f"{column} dropped"
        })

    except Exception as e:
        print("DROP COLUMN ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Unable to drop column"
        }), 500


# --------------------------------------------------
# RENAME COLUMN
# --------------------------------------------------
@dataset_structure_bp.route("/rename_column", methods=["POST"])
def rename_column():
    try:
        data = request.get_json(silent=True) or {}

        old_name = data.get("old_name")
        new_name = data.get("new_name")

        if (
            not isinstance(old_name, str)
            or not old_name.strip()
            or not isinstance(new_name, str)
            or not new_name.strip()
        ):
            return jsonify({
                "success": False,
                "message": "Valid old and new column names are required"
            }), 400

        old_name = old_name.strip()
        new_name = new_name.strip()

        df, _ = get_active_dataframe()

        if old_name not in df.columns:
            return jsonify({
                "success": False,
                "message": "Old column not found"
            }), 404

        if new_name in df.columns and new_name != old_name:
            return jsonify({
                "success": False,
                "message": "Column already exists"
            }), 409

        df.rename(
            columns={old_name: new_name},
            inplace=True
        )

        save_active_dataframe(df)

        return jsonify({
            "success": True,
            "message": "Column renamed"
        })

    except Exception as e:
        print("RENAME COLUMN ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Unable to rename column"
        }), 500


# --------------------------------------------------
# ADD ROW
# --------------------------------------------------
@dataset_structure_bp.route("/add_row", methods=["POST"])
def add_row():
    try:
        df, _ = get_active_dataframe()

        new_row = {
            col: ""
            for col in df.columns
        }

        df.loc[len(df)] = new_row

        save_active_dataframe(df)

        return jsonify({
            "success": True,
            "message": "Row added",
            "rows": len(df)
        })

    except Exception as e:
        print("ADD ROW ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Unable to add row"
        }), 500
