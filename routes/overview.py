from flask import Blueprint, jsonify, session
import pandas as pd

from .config import get_db

overview_bp = Blueprint("overview", __name__)


@overview_bp.route("/overview", methods=["GET"])
def get_overview():

    try:

        # -----------------------------------------
        # Check active dataset
        # -----------------------------------------

        active_dataset_id = session.get("active_dataset_id")
        active_copy_id = session.get("active_copy_id")

        if active_dataset_id is None:
            return jsonify({
                "success": False,
                "error": "No active dataset selected."
            }), 400


        conn = get_db()
        cursor = conn.cursor(dictionary=True)


        # =========================================
        # ACTIVE COPY
        # =========================================

        if active_copy_id:

            cursor.execute(
                """
                SELECT
                    id,
                    file_path,
                    COALESCE(updated_name, name) AS dataset_name,
                    row_count
                FROM dataframe_copies
                WHERE id=%s
                  AND status != 'deleted'
                """,
                (active_copy_id,)
            )

            row = cursor.fetchone()

            if row is None:
                return jsonify({
                    "success": False,
                    "error": "Active copy not found."
                }), 404


            file_path = row["file_path"]
            dataset_name = row["dataset_name"]

            file_type = "json"

            # Copies are stored as JSON
            df = pd.read_json(file_path)

            dataset_id = active_dataset_id


        # =========================================
        # ORIGINAL DATASET
        # =========================================

        else:

            cursor.execute(
                """
                SELECT
                    id,
                    file_path,
                    file_type,
                    COALESCE(updated_name, original_name) AS dataset_name,
                    row_count,
                    column_count,
                    file_size
                FROM datasets
                WHERE id=%s
                  AND status != 'deleted'
                """,
                (active_dataset_id,)
            )

            row = cursor.fetchone()

            if row is None:
                return jsonify({
                    "success": False,
                    "error": "Active dataset not found."
                }), 404


            file_path = row["file_path"]
            file_type = row["file_type"]
            dataset_name = row["dataset_name"]

            dataset_id = row["id"]


            # -----------------------------------------
            # Load dataset
            # -----------------------------------------

            if file_type == "csv":

                try:

                    df = pd.read_csv(
                        file_path,
                        encoding="utf-8",
                        on_bad_lines="skip"
                    )

                except UnicodeDecodeError:

                    df = pd.read_csv(
                        file_path,
                        encoding="latin1",
                        on_bad_lines="skip"
                    )

            elif file_type == "json":

                df = pd.read_json(file_path)

            else:

                return jsonify({
                    "success": False,
                    "error": "Unsupported dataset type."
                }), 400


        # =========================================
        # BASIC DATASET INFORMATION
        # =========================================

        rows = len(df)
        columns = len(df.columns)


        # =========================================
        # MISSING VALUES
        # =========================================

        missing_per_column = df.isnull().sum()

        missing_total = int(
            missing_per_column.sum()
        )

        columns_with_missing = int(
            (missing_per_column > 0).sum()
        )


        # =========================================
        # DUPLICATES
        # =========================================

        duplicate_rows = int(
            df.duplicated().sum()
        )


        # =========================================
        # COLUMN TYPES
        # =========================================

        numeric_columns = int(
            df.select_dtypes(
                include="number"
            ).shape[1]
        )

        categorical_columns = int(
            df.select_dtypes(
                include=["object", "category"]
            ).shape[1]
        )

        boolean_columns = int(
            df.select_dtypes(
                include="bool"
            ).shape[1]
        )


        # =========================================
        # COMPLETENESS
        # =========================================

        total_cells = rows * columns

        if total_cells > 0:

            completeness = round(
                (
                    (total_cells - missing_total)
                    / total_cells
                ) * 100,
                2
            )

        else:

            completeness = 100


        # =========================================
        # MEMORY USAGE
        # =========================================

        memory_usage = int(
            df.memory_usage(
                deep=True
            ).sum()
        )


        # =========================================
        # COLUMN INFORMATION
        # =========================================

        column_info = []

        for column in df.columns:

            column_info.append({

                "name": column,

                "dtype": str(
                    df[column].dtype
                ),

                "missing": int(
                    df[column].isnull().sum()
                ),

                "unique": int(
                    df[column].nunique(
                        dropna=True
                    )
                )

            })


        # =========================================
        # NUMERIC SUMMARY
        # =========================================

        numeric_summary = {}

        numeric_df = df.select_dtypes(
            include="number"
        )

        if not numeric_df.empty:

            numeric_summary = (
                numeric_df
                .describe()
                .fillna("")
                .to_dict()
            )


        # =========================================
        # CLOSE DATABASE
        # =========================================

        cursor.close()
        conn.close()


        # =========================================
        # RESPONSE
        # =========================================

        return jsonify({

            "success": True,

            "dataset": {

                "id": dataset_id,

                "name": dataset_name,

                "file_type": file_type,

                "rows": rows,

                "columns": columns

            },

            "quality": {

                "missing_values": missing_total,

                "columns_with_missing":
                    columns_with_missing,

                "duplicate_rows":
                    duplicate_rows,

                "completeness":
                    completeness

            },

            "column_types": {

                "numeric":
                    numeric_columns,

                "categorical":
                    categorical_columns,

                "boolean":
                    boolean_columns

            },

            "memory": {

                "bytes":
                    memory_usage,

                "mb":
                    round(
                        memory_usage /
                        (1024 * 1024),
                        2
                    )

            },

            "columns_info":
                column_info,

            "statistics":
                numeric_summary

        })


    except Exception as e:

        print("Overview error:", e)

        return jsonify({

            "success": False,

            "error": str(e)

        }), 500
