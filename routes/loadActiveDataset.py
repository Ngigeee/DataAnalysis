from flask import session
from .config import get_db
import pandas as pd
import numpy as np
import json


def get_active_dataframe():
    """
    Returns the currently active dataframe and its display name.
    Loads either the active dataset or active copy.
    """

    active_dataset_id = session.get("active_dataset_id")
    active_copy_id = session.get("active_copy_id")

    if active_dataset_id is None:
        raise Exception("No active dataset selected.")

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        # -------------------------
        # Active Copy
        # -------------------------
        if active_copy_id:

            cursor.execute(
                """
                SELECT
                    file_path,
                    COALESCE(updated_name, name) AS dataset_name
                FROM dataframe_copies
                WHERE id=%s
                """,
                (active_copy_id,)
            )

            row = cursor.fetchone()

            if row is None:
                raise Exception("Active copy not found.")

            with open(row["file_path"], "r", encoding="utf-8") as f:

                data = json.load(f)

            return pd.DataFrame(data), row["dataset_name"]


        # -------------------------
        # Active Dataset
        # -------------------------
        cursor.execute(
            """
            SELECT
                file_path,
                file_type,
                COALESCE(updated_name, original_name) AS dataset_name
            FROM datasets
            WHERE id=%s
            """,
            (active_dataset_id,)
        )

        row = cursor.fetchone()

        if row is None:
            raise Exception("Active dataset not found.")


        # -------------------------
        # Load CSV safely
        # -------------------------
        if row["file_type"] == "csv":

            try:

                df = pd.read_csv(
                    row["file_path"],
                    encoding="utf-8",
                    on_bad_lines="warn"
                )


            except UnicodeDecodeError:

                df = pd.read_csv(
                    row["file_path"],
                    encoding="latin1",
                    on_bad_lines="warn"
                )


            except pd.errors.ParserError:

                df = pd.read_csv(
                    row["file_path"],
                    encoding="utf-8",
                    engine="python",
                    on_bad_lines="skip"
                )


        # -------------------------
        # Load JSON
        # -------------------------
        else:

            df = pd.read_json(
                row["file_path"]
            )


        return df, row["dataset_name"]


    finally:

        cursor.close()
        conn.close()



def save_active_dataframe(df):
    """
    Saves the currently active dataframe back to disk and
    updates database metadata.
    """


    # --------------------------------
    # Clean dataframe before saving
    # --------------------------------
    df = (
        df.copy()
        .astype(object)
        .replace([np.nan, np.inf, -np.inf], None)
    )


    active_dataset_id = session.get("active_dataset_id")
    active_copy_id = session.get("active_copy_id")


    if active_dataset_id is None:

        raise Exception(
            "No active dataset selected."
        )


    conn = get_db()
    cursor = conn.cursor(dictionary=True)


    try:


        # --------------------------------
        # Save Copy
        # --------------------------------
        if active_copy_id:


            cursor.execute(
                """
                SELECT file_path
                FROM dataframe_copies
                WHERE id=%s
                """,
                (active_copy_id,)
            )


            row = cursor.fetchone()


            if row is None:

                raise Exception(
                    "Copy not found."
                )


            with open(
                row["file_path"],
                "w",
                encoding="utf-8"
            ) as f:


                json.dump(
                    df.to_dict(orient="records"),
                    f,
                    ensure_ascii=False,
                    indent=2
                )


            cursor.execute(
                """
                UPDATE dataframe_copies
                SET row_count=%s
                WHERE id=%s
                """,
                (
                    len(df),
                    active_copy_id
                )
            )



        # --------------------------------
        # Save Original Dataset
        # --------------------------------
        else:


            cursor.execute(
                """
                SELECT file_path, file_type
                FROM datasets
                WHERE id=%s
                """,
                (active_dataset_id,)
            )


            row = cursor.fetchone()


            if row is None:

                raise Exception(
                    "Dataset not found."
                )



            if row["file_type"] == "csv":


                df.to_csv(
                    row["file_path"],
                    index=False,
                    na_rep=""
                )


            else:


                with open(
                    row["file_path"],
                    "w",
                    encoding="utf-8"
                ) as f:


                    json.dump(
                        df.to_dict(orient="records"),
                        f,
                        ensure_ascii=False,
                        indent=2
                    )



            cursor.execute(
                """
                UPDATE datasets
                SET
                    row_count=%s,
                    column_count=%s
                WHERE id=%s
                """,
                (
                    len(df),
                    len(df.columns),
                    active_dataset_id
                )
            )



        conn.commit()



    finally:

        cursor.close()
        conn.close()
