from flask import Blueprint, jsonify, session
from .config import get_db


datasets_bp = Blueprint(
    "datasets",
    __name__
)


@datasets_bp.route(
    "/loggedin_datasets",
    methods=["GET"]
)
def get_datasets():

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

        active_dataset_id = session.get(
            "active_dataset_id"
        )

        active_copy_id = session.get(
            "active_copy_id"
        )


        # =========================================
        # DATABASE CONNECTION
        # =========================================

        conn = get_db()

        cursor = conn.cursor(
            dictionary=True
        )


        # =========================================
        # GET USER DATASETS
        # =========================================

        cursor.execute(
            """
            SELECT
                id,
                COALESCE(
                    updated_name,
                    original_name
                ) AS name,
                row_count,
                column_count,
                created_at
            FROM datasets
            WHERE user_id=%s
              AND status != 'deleted'
            ORDER BY created_at DESC
            """,
            (user_id,)
        )

        datasets = cursor.fetchall()


        # =========================================
        # GET ALL COPIES IN ONE QUERY
        # =========================================

        if datasets:

            dataset_ids = [
                dataset["id"]
                for dataset in datasets
            ]

            placeholders = ",".join(
                ["%s"] * len(dataset_ids)
            )

            cursor.execute(
                f"""
                SELECT
                    id,
                    owner_dataframe_id,
                    COALESCE(
                        updated_name,
                        name
                    ) AS name,
                    row_count,
                    created_at
                FROM dataframe_copies
                WHERE owner_dataframe_id IN
                    ({placeholders})
                  AND status != 'deleted'
                ORDER BY created_at DESC
                """,
                tuple(dataset_ids)
            )

            copies = cursor.fetchall()

        else:

            copies = []


        # =========================================
        # ORGANIZE COPIES BY DATASET
        # =========================================

        copies_by_dataset = {}

        for copy in copies:

            owner_id = copy[
                "owner_dataframe_id"
            ]

            copy["active"] = (
                copy["id"] == active_copy_id
            )

            copies_by_dataset.setdefault(
                owner_id,
                []
            ).append(copy)


        # =========================================
        # ATTACH COPIES TO DATASETS
        # =========================================

        for dataset in datasets:

            dataset_id = dataset["id"]

            dataset["active"] = (
                dataset_id ==
                active_dataset_id
            )

            dataset["copies"] = (
                copies_by_dataset.get(
                    dataset_id,
                    []
                )
            )


        # =========================================
        # CLOSE DATABASE
        # =========================================

        cursor.close()
        conn.close()


        # =========================================
        # RETURN
        # =========================================

        return jsonify({

            "success": True,

            "datasets": datasets

        })


    except Exception as e:

        print(
            "Get datasets error:",
            e
        )


        return jsonify({

            "success": False,

            "error": str(e)

        }), 500
        
@datasets_bp.route("/api/datasets/<int:dataset_id>/download")
def download_dataset(dataset_id):

    if "user" not in session:
        return jsonify({
            "success": False,
            "error": "Not logged in"
        }), 401

    user_id = session["user"]["id"]

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM datasets
        WHERE id = %s
          AND user_id = %s
          AND status = 'active'
    """, (dataset_id, user_id))

    dataset = cursor.fetchone()

    cursor.close()
    conn.close()

    if not dataset:
        return jsonify({
            "success": False,
            "error": "Dataset not found"
        }), 404

    return send_file(
        dataset["file_path"],
        as_attachment=True,
        download_name=(
            dataset["updated_name"]
            or dataset["original_name"]
        )
    )
