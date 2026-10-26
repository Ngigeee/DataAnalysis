from flask import (
    Blueprint,
    jsonify,
    session,
    request,
    redirect,
    url_for,
    render_template
)

from routes.config import get_db

import os
import json


# =========================================================
# CREATE BLUEPRINT
# =========================================================

profile_details_bp = Blueprint(
    'profile',
    __name__,
    url_prefix='/profile_details'
)


# =========================================================
# LOGIN CHECK
# =========================================================

def get_logged_in_user_id():

    user = session.get("user")

    if not user:
        return None

    return user.get("id")


# =========================================================
# DATABASE HELPERS
# =========================================================

def close_db(db, cursor):

    try:
        cursor.close()
    except Exception:
        pass

    try:
        db.close()
    except Exception:
        pass


# =========================================================
# USER DETAILS
# GET /profile_details/user
# =========================================================

@profile_details_bp.route('/user', methods=['GET'])
def get_user():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM users
            WHERE id = %s
            LIMIT 1
        """, (user_id,))

        user = cursor.fetchone()

        if not user:
            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404

        sensitive_fields = [
            'password',
            'password_hash',
            'reset_token',
            'verification_token',
            'oauth_token',
            'access_token'
        ]

        for field in sensitive_fields:
            user.pop(field, None)

        storage = calculate_storage(
            cursor,
            user_id
        )

        return jsonify({
            "success": True,
            "user": user,
            "storage": storage
        })

    finally:

        close_db(db, cursor)


# =========================================================
# API KEY
# GET /profile_details/api
# =========================================================

@profile_details_bp.route('/api', methods=['GET'])
def get_api():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                id,
                user_id,
                name,
                created_at,
                last_used_at,
                expires_at,
                is_active
            FROM api_keys
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
        """, (user_id,))

        api_key = cursor.fetchone()

        return jsonify({
            "success": True,
            "api_key": api_key
        })

    finally:

        close_db(db, cursor)


# =========================================================
# DATASETS
# GET /profile_details/datasets
# =========================================================

@profile_details_bp.route('/datasets', methods=['GET'])
def get_datasets():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM datasets
            WHERE user_id = %s
              AND status = 'active'
            ORDER BY created_at DESC
        """, (user_id,))

        datasets = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(datasets),
            "datasets": datasets
        })

    finally:

        close_db(db, cursor)


# =========================================================
# DATASET COPIES
#
# GET /profile_details/copies
#
# Also returns original dataset name.
# =========================================================

# =========================================================
# DATASET COPIES
# GET /profile_details/copies
# =========================================================

@profile_details_bp.route('/copies', methods=['GET'])
def get_copies():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "error": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                c.id,
                c.owner_dataframe_id,
                c.user_id,
                c.name,
                c.updated_name,
                c.file_path,
                c.row_count,
                c.created_at,
                c.status,

                /* Original dataset information */
                d.id AS original_dataset_id,
                d.original_name AS original_dataset_name,
                d.stored_name AS original_dataset_stored_name

            FROM dataframe_copies c

            LEFT JOIN datasets d
                ON c.owner_dataframe_id = d.id

            WHERE c.user_id = %s
            AND c.status = 'active'

            ORDER BY c.created_at DESC
        """, (user_id,))

        copies = cursor.fetchall()

        # -------------------------------------------------
        # ADD FILE SIZE
        # -------------------------------------------------

        for copy in copies:

            file_path = copy.get("file_path")

            copy["file_size"] = 0

            if file_path:

                try:

                    if os.path.isfile(file_path):
                        copy["file_size"] = os.path.getsize(file_path)

                except (OSError, TypeError):
                    copy["file_size"] = 0

        return jsonify({
            'success': True,
            'count': len(copies),
            'copies': copies
        })

    finally:

        cursor.close()
        db.close()


# =========================================================
# SAVED MODELS
# GET /profile_details/models
# =========================================================

@profile_details_bp.route('/models', methods=['GET'])
def get_models():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM saved_models
            WHERE user_id = %s
            ORDER BY created_at DESC
        """, (user_id,))

        models = cursor.fetchall()

        # Convert JSON fields if necessary
        for model in models:

            if isinstance(model.get("features"), str):

                try:
                    model["features"] = json.loads(
                        model["features"]
                    )
                except Exception:
                    pass

            if isinstance(model.get("metrics"), str):

                try:
                    model["metrics"] = json.loads(
                        model["metrics"]
                    )
                except Exception:
                    pass

            # Give old models a fallback name
            if not model.get("name"):

                model["name"] = (
                    f"{str(model.get('model_type', 'Model')).replace('_', ' ').title()}"
                    f" - {model.get('target', 'Target')}"
                )

        return jsonify({
            "success": True,
            "count": len(models),
            "models": models
        })

    finally:

        close_db(db, cursor)


# =========================================================
# ACTIVITY
# GET /profile_details/activity
# =========================================================

@profile_details_bp.route('/activity', methods=['GET'])
def get_activity():

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM activity
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user_id,))

        activities = cursor.fetchall()

        return jsonify({
            "success": True,
            "count": len(activities),
            "activity": activities
        })

    finally:

        close_db(db, cursor)


# =========================================================
# STORAGE CALCULATOR
#
# IMPORTANT:
# Only ACTIVE datasets and ACTIVE copies count.
#
# Models are counted from saved model files.
# =========================================================

def calculate_storage(cursor, user_id):

    # -----------------------------------------------------
    # ACTIVE DATASETS
    # -----------------------------------------------------

    cursor.execute("""
        SELECT COALESCE(SUM(file_size), 0) AS total_size

        FROM datasets

        WHERE user_id = %s
          AND status = 'active'
    """, (user_id,))

    dataset_result = cursor.fetchone()

    dataset_storage = int(
        dataset_result["total_size"]
        if dataset_result
        and dataset_result["total_size"]
        else 0
    )


    # -----------------------------------------------------
    # ACTIVE COPIES
    # -----------------------------------------------------

    cursor.execute("""
        SELECT file_path

        FROM dataframe_copies

        WHERE user_id = %s
          AND status = 'active'
    """, (user_id,))

    copies = cursor.fetchall()

    copy_storage = 0

    for copy in copies:

        file_path = copy.get("file_path")

        if not file_path:
            continue

        try:

            if os.path.isfile(file_path):

                copy_storage += os.path.getsize(
                    file_path
                )

        except (OSError, TypeError):

            continue


    # -----------------------------------------------------
    # SAVED MODELS
    # -----------------------------------------------------

    cursor.execute("""
        SELECT file_path

        FROM saved_models

        WHERE user_id = %s
    """, (user_id,))

    models = cursor.fetchall()

    model_storage = 0

    for model in models:

        file_path = model.get("file_path")

        if not file_path:
            continue

        try:

            if os.path.isfile(file_path):

                model_storage += os.path.getsize(
                    file_path
                )

        except (OSError, TypeError):

            continue


    # -----------------------------------------------------
    # TOTAL
    # -----------------------------------------------------

    total_storage = (
        dataset_storage
        + copy_storage
        + model_storage
    )


    # -----------------------------------------------------
    # LIMIT
    # -----------------------------------------------------

    free_limit = 500 * 1024 * 1024


    percentage = (
        (total_storage / free_limit) * 100
        if free_limit > 0
        else 0
    )


    return {

        "used_bytes": total_storage,

        "limit_bytes": free_limit,

        "datasets_bytes": dataset_storage,

        "copies_bytes": copy_storage,

        "models_bytes": model_storage,

        "percentage": round(
            min(percentage, 100),
            2
        )
    }


# =========================================================
# =========================================================
# MODEL ACTIONS
# =========================================================
# =========================================================


# =========================================================
# VIEW MODEL
#
# GET /try_model/<model_id>
# =========================================================

@profile_details_bp.route(
    '/try_model/<int:model_id>',
    methods=['GET']
)
def try_model(model_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return redirect(
            url_for('login')
        )

    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM saved_models

            WHERE id = %s
              AND user_id = %s

            LIMIT 1
        """, (
            model_id,
            user_id
        ))

        model = cursor.fetchone()

        if not model:

            return "Model not found", 404


        # -------------------------------------------------
        # FEATURES
        # -------------------------------------------------

        features = model.get("features")

        if isinstance(features, str):

            try:
                features = json.loads(features)

            except Exception:

                features = [
                    f.strip()
                    for f in features.split(",")
                    if f.strip()
                ]

        if not isinstance(features, list):

            features = []


        # -------------------------------------------------
        # METRICS
        # -------------------------------------------------

        metrics = model.get("metrics")

        if isinstance(metrics, str):

            try:
                metrics = json.loads(metrics)

            except Exception:

                metrics = {}


        # -------------------------------------------------
        # NAME
        # -------------------------------------------------

        if not model.get("name"):

            model["name"] = (
                f"{str(model.get('model_type', 'Model'))}"
                f" - {model.get('target', 'Target')}"
            )


        return render_template(
            "try_model.html",
            model=model,
            features=features,
            metrics=metrics or {}
        )

    finally:

        close_db(db, cursor)


# =========================================================
# RUN MODEL
#
# POST /try_model/<model_id>/run
# =========================================================

@profile_details_bp.route(
    '/try_model/<int:model_id>/run',
    methods=['POST']
)
def run_saved_model(model_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM saved_models

            WHERE id = %s
              AND user_id = %s

            LIMIT 1
        """, (
            model_id,
            user_id
        ))

        model = cursor.fetchone()

        if not model:

            return jsonify({
                "success": False,
                "message": "Model not found."
            }), 404


        # -------------------------------------------------
        # LOAD FEATURES
        # -------------------------------------------------

        features = model.get("features")

        if isinstance(features, str):

            try:

                features = json.loads(features)

            except Exception:

                features = [
                    f.strip()
                    for f in features.split(",")
                    if f.strip()
                ]


        if not isinstance(features, list):

            return jsonify({
                "success": False,
                "message": "This model has no valid features."
            }), 400


        # -------------------------------------------------
        # INPUT
        # -------------------------------------------------

        payload = request.get_json(
            silent=True
        )

        if not payload:

            payload = request.form.to_dict()


        # -------------------------------------------------
        # CHECK ALL FEATURES
        # -------------------------------------------------

        missing = []

        for feature in features:

            if (
                feature not in payload
                or str(payload[feature]).strip() == ""
            ):

                missing.append(feature)


        if missing:

            return jsonify({
                "success": False,
                "message": "Missing feature values.",
                "missing_features": missing
            }), 400


        # -------------------------------------------------
        # LOAD SAVED MODEL
        # -------------------------------------------------

        model_path = model.get("file_path")

        if not model_path:

            return jsonify({
                "success": False,
                "message": "Model file path is missing."
            }), 500


        if not os.path.isfile(model_path):

            return jsonify({
                "success": False,
                "message": "Saved model file could not be found."
            }), 404


        # -------------------------------------------------
        # LOAD PICKLE
        # -------------------------------------------------

        import joblib

        trained_model = joblib.load(
            model_path
        )


        # -------------------------------------------------
        # PREPARE INPUT
        # -------------------------------------------------

        import pandas as pd


        values = []

        for feature in features:

            value = payload[feature]

            try:

                value = float(value)

            except (ValueError, TypeError):

                value = str(value)

            values.append(value)


        input_df = pd.DataFrame(
            [values],
            columns=features
        )


        # -------------------------------------------------
        # PREDICT
        # -------------------------------------------------

        prediction = trained_model.predict(
            input_df
        )


        result = prediction[0]


        # Convert numpy values to Python
        if hasattr(result, "item"):

            result = result.item()


        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "model_id": model_id,

            "model_name": model.get("name"),

            "target": model.get("target"),

            "features": features,

            "prediction": result

        })

    except Exception as e:

        import traceback

        traceback.print_exc()

        return jsonify({

            "success": False,

            "message": str(e)

        }), 500

    finally:

        close_db(db, cursor)


# =========================================================
# RENAME MODEL
#
# POST /profile_details/models/<id>/rename
# =========================================================

@profile_details_bp.route(
    '/models/<int:model_id>/rename',
    methods=['POST']
)
def rename_model(model_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    data = request.get_json(
        silent=True
    ) or request.form


    name = str(
        data.get("name", "")
    ).strip()


    if not name:

        return jsonify({
            "success": False,
            "message": "Model name is required."
        }), 400


    if len(name) > 255:

        return jsonify({
            "success": False,
            "message": "Model name is too long."
        }), 400


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # =====================================================
        # GET MODEL
        # =====================================================

        cursor.execute("""
            SELECT
                id,
                name
            FROM saved_models

            WHERE id = %s
              AND user_id = %s

            LIMIT 1
        """, (
            model_id,
            user_id
        ))

        model = cursor.fetchone()


        if not model:

            return jsonify({
                "success": False,
                "message": "Model not found."
            }), 404


        old_name = model.get("name") or "Unnamed Model"


        # =====================================================
        # UPDATE MODEL NAME
        # =====================================================

        cursor.execute("""
            UPDATE saved_models

            SET name = %s

            WHERE id = %s
              AND user_id = %s
        """, (
            name,
            model_id,
            user_id
        ))


        # =====================================================
        # RECORD ACTIVITY
        # =====================================================

        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                entity_type,
                entity_id
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            user_id,
            "model_renamed",
            f"Renamed model from '{old_name}' to '{name}'",
            "model",
            model_id
        ))


        # =====================================================
        # COMMIT BOTH OPERATIONS
        # =====================================================

        db.commit()


        return jsonify({

            "success": True,

            "message":
                "Model renamed successfully.",

            "model_id":
                model_id,

            "name":
                name

        })


    except Exception as e:

        db.rollback()

        print(
            "Rename model error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to rename model."

        }), 500


    finally:

        close_db(
            db,
            cursor
        )


# =========================================================
# DELETE MODEL
#
# POST /profile_details/models/<id>/delete
# =========================================================

@profile_details_bp.route(
    '/models/<int:model_id>/delete',
    methods=['POST']
)
def delete_model(model_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # GET MODEL
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM saved_models

            WHERE id = %s
              AND user_id = %s

            LIMIT 1
        """, (
            model_id,
            user_id
        ))

        model = cursor.fetchone()


        if not model:

            return jsonify({
                "success": False,
                "message": "Model not found."
            }), 404


        model_name = (
            model.get("name")
            or "Unnamed Model"
        )


        file_path = model.get(
            "file_path"
        )


        # -------------------------------------------------
        # DELETE MODEL FILE
        # -------------------------------------------------

        if file_path:

            try:

                if os.path.isfile(file_path):

                    os.remove(
                        file_path
                    )

            except OSError:

                # Don't fail database deletion if
                # the physical file is already missing.
                pass


        # -------------------------------------------------
        # DELETE DATABASE RECORD
        # -------------------------------------------------

        cursor.execute("""
            DELETE FROM saved_models

            WHERE id = %s
              AND user_id = %s
        """, (
            model_id,
            user_id
        ))


        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Model could not be deleted."
            }), 404


        # -------------------------------------------------
        # ADD ACTIVITY
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (
                %s,
                %s,
                %s,
                NOW()
            )
        """, (
            user_id,
            "delete_model",
            f'Deleted model "{model_name}"'
        ))


        # -------------------------------------------------
        # COMMIT
        # -------------------------------------------------

        db.commit()


        return jsonify({

            "success": True,

            "message":
                "Model deleted successfully.",

            "model_id":
                model_id

        })


    except Exception as e:

        db.rollback()

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        close_db(db, cursor)


# =========================================================
# =========================================================
# DATASET ACTIONS
# =========================================================
# =========================================================


# =========================================================
# VIEW DATASET
# GET /try_dataset/<dataset_id>
# =========================================================

@profile_details_bp.route(
    '/try_dataset/<int:dataset_id>',
    methods=['GET']
)
def try_dataset(dataset_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return redirect(
            url_for('login')
        )


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT *
            FROM datasets

            WHERE id = %s
              AND user_id = %s
              AND status = 'active'

            LIMIT 1
        """, (
            dataset_id,
            user_id
        ))

        dataset = cursor.fetchone()

        if not dataset:

            return "Dataset not found", 404


        return render_template(
            "try_dataset.html",
            dataset=dataset
        )

    finally:

        close_db(db, cursor)


# =========================================================
# DELETE DATASET
#
# POST /profile_details/datasets/<id>/delete
# =========================================================

@profile_details_bp.route(
    '/datasets/<int:dataset_id>/delete',
    methods=['POST']
)
def delete_dataset(dataset_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # GET DATASET
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM datasets

            WHERE id = %s
              AND user_id = %s

            LIMIT 1
        """, (
            dataset_id,
            user_id
        ))

        dataset = cursor.fetchone()


        if not dataset:

            return jsonify({
                "success": False,
                "message": "Dataset not found."
            }), 404


        # Get name BEFORE soft deletion
        dataset_name = (
            dataset.get("updated_name")
            or dataset.get("name")
            or dataset.get("original_name")
            or "Unnamed Dataset"
        )


        # -------------------------------------------------
        # SOFT DELETE
        # -------------------------------------------------

        cursor.execute("""
            UPDATE datasets

            SET status = 'deleted'

            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            dataset_id,
            user_id
        ))


        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Dataset could not be deleted."
            }), 404


        # -------------------------------------------------
        # ADD ACTIVITY
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (
                %s,
                %s,
                %s,
                NOW()
            )
        """, (
            user_id,
            "delete_dataset",
            f'Deleted dataset "{dataset_name}"'
        ))


        # -------------------------------------------------
        # COMMIT
        # -------------------------------------------------

        db.commit()


        return jsonify({

            "success": True,

            "message":
                "Dataset deleted successfully.",

            "dataset_id":
                dataset_id

        })


    except Exception as e:

        db.rollback()

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        close_db(db, cursor)


# =========================================================
# RENAME DATASET
# =========================================================

@profile_details_bp.route(
    '/datasets/<int:dataset_id>/rename',
    methods=['POST']
)
def rename_dataset(dataset_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    data = request.get_json(
        silent=True
    ) or request.form


    name = str(
        data.get("name", "")
    ).strip()


    if not name:

        return jsonify({
            "success": False,
            "message": "Dataset name is required."
        }), 400


    if len(name) > 255:

        return jsonify({
            "success": False,
            "message": "Dataset name is too long."
        }), 400


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # =====================================================
        # GET EXISTING DATASET
        # =====================================================

        cursor.execute("""
            SELECT
                id,
                name,
                updated_name
            FROM datasets

            WHERE id = %s
              AND user_id = %s
              AND status = 'active'

            LIMIT 1
        """, (
            dataset_id,
            user_id
        ))


        dataset = cursor.fetchone()


        if not dataset:

            return jsonify({
                "success": False,
                "message": "Dataset not found."
            }), 404


        # Current displayed name
        old_name = (
            dataset.get("updated_name")
            or dataset.get("name")
            or "Unnamed Dataset"
        )


        # =====================================================
        # UPDATE DATASET NAME
        # =====================================================

        cursor.execute("""
            UPDATE datasets

            SET updated_name = %s

            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            name,
            dataset_id,
            user_id
        ))


        # =====================================================
        # RECORD ACTIVITY
        # =====================================================

        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                entity_type,
                entity_id
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """, (
            user_id,
            "dataset_renamed",
            f"Renamed dataset from '{old_name}' to '{name}'",
            "dataset",
            dataset_id
        ))


        # =====================================================
        # COMMIT
        # =====================================================

        db.commit()


        return jsonify({

            "success": True,

            "message":
                "Dataset renamed successfully.",

            "dataset_id":
                dataset_id,

            "name":
                name

        })


    except Exception as e:

        db.rollback()

        print(
            "Rename dataset error:",
            e
        )

        return jsonify({

            "success": False,

            "message":
                "Failed to rename dataset."

        }), 500


    finally:

        close_db(
            db,
            cursor
        )


# =========================================================
# =========================================================
# DATASET COPY ACTIONS
# =========================================================
# =========================================================


# =========================================================
# VIEW COPY
# GET /try_copy/<copy_id>
# =========================================================

@profile_details_bp.route(
    '/try_copy/<int:copy_id>',
    methods=['GET']
)
def try_copy(copy_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return redirect(
            url_for('login')
        )


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                c.*,

                d.original_name AS original_dataset_name,
                d.updated_name AS original_updated_name

            FROM dataframe_copies c

            LEFT JOIN datasets d
                ON d.id = c.dataset_id
                AND d.user_id = c.user_id

            WHERE c.id = %s
              AND c.user_id = %s
              AND c.status = 'active'

            LIMIT 1
        """, (
            copy_id,
            user_id
        ))

        copy = cursor.fetchone()

        if not copy:

            return "Dataset copy not found", 404


        return render_template(
            "try_copy.html",
            copy=copy
        )

    finally:

        close_db(db, cursor)


# =========================================================
# RENAME COPY
# =========================================================

@profile_details_bp.route(
    '/copies/<int:copy_id>/rename',
    methods=['POST']
)
def rename_copy(copy_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    data = request.get_json(
        silent=True
    ) or request.form


    name = str(
        data.get("name", "")
    ).strip()


    if not name:

        return jsonify({
            "success": False,
            "message": "Copy name is required."
        }), 400


    if len(name) > 255:

        return jsonify({
            "success": False,
            "message": "Copy name is too long."
        }), 400


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # GET CURRENT COPY NAME
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                id,
                name,
                updated_name
            FROM dataframe_copies
            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
            LIMIT 1
        """, (
            copy_id,
            user_id
        ))

        copy = cursor.fetchone()


        if not copy:

            return jsonify({
                "success": False,
                "message": "Dataset copy not found."
            }), 404


        old_name = (
            copy.get("updated_name")
            or copy.get("name")
            or "Dataset Copy"
        )


        # -------------------------------------------------
        # UPDATE COPY NAME
        # -------------------------------------------------

        cursor.execute("""
            UPDATE dataframe_copies

            SET updated_name = %s

            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            name,
            copy_id,
            user_id
        ))


        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Dataset copy was not renamed."
            }), 404


        # -------------------------------------------------
        # ADD ACTIVITY
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (
                %s,
                %s,
                %s,
                NOW()
            )
        """, (
            user_id,
            "rename_copy",
            f'Renamed dataset copy "{old_name}" to "{name}"'
        ))


        # -------------------------------------------------
        # COMMIT EVERYTHING
        # -------------------------------------------------

        db.commit()


        return jsonify({

            "success": True,

            "message":
                "Dataset copy renamed successfully.",

            "copy_id":
                copy_id,

            "name":
                name

        })


    except Exception as e:

        db.rollback()

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        close_db(db, cursor)


# =========================================================
# DELETE COPY
# =========================================================

@profile_details_bp.route(
    '/copies/<int:copy_id>/delete',
    methods=['POST']
)
def delete_copy(copy_id):

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # GET COPY
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM dataframe_copies

            WHERE id = %s
              AND user_id = %s
              AND status = 'active'

            LIMIT 1
        """, (
            copy_id,
            user_id
        ))

        copy = cursor.fetchone()


        if not copy:

            return jsonify({
                "success": False,
                "message": "Dataset copy not found."
            }), 404


        # -------------------------------------------------
        # GET COPY NAME BEFORE DELETING
        # -------------------------------------------------

        copy_name = (
            copy.get("updated_name")
            or copy.get("name")
            or "Dataset Copy"
        )


        # -------------------------------------------------
        # GET FILE PATH
        # -------------------------------------------------

        file_path = copy.get(
            "file_path"
        )


        # -------------------------------------------------
        # DELETE FILE
        # -------------------------------------------------

        if file_path:

            try:

                if os.path.isfile(file_path):

                    os.remove(
                        file_path
                    )

            except OSError:

                # File may already be missing.
                # Continue with database soft delete.
                pass


        # -------------------------------------------------
        # SOFT DELETE
        # -------------------------------------------------

        cursor.execute("""
            UPDATE dataframe_copies

            SET status = 'deleted'

            WHERE id = %s
              AND user_id = %s
              AND status = 'active'
        """, (
            copy_id,
            user_id
        ))


        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "message": "Dataset copy could not be deleted."
            }), 404


        # -------------------------------------------------
        # ADD ACTIVITY
        # -------------------------------------------------

        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (
                %s,
                %s,
                %s,
                NOW()
            )
        """, (
            user_id,
            "delete_copy",
            f'Deleted dataset copy "{copy_name}"'
        ))


        # -------------------------------------------------
        # COMMIT
        # -------------------------------------------------

        db.commit()


        return jsonify({

            "success": True,

            "message":
                "Dataset copy deleted successfully.",

            "copy_id":
                copy_id

        })


    except Exception as e:

        db.rollback()

        return jsonify({

            "success": False,

            "message":
                str(e)

        }), 500


    finally:

        close_db(db, cursor)


# =========================================================
# FULL PROFILE
# GET /profile_details
# =========================================================

@profile_details_bp.route('', methods=['GET'])
def get_full_profile():

    user_id = get_logged_in_user_id()

    if user_id is None:

        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401


    db = get_db()
    cursor = db.cursor(dictionary=True)

    try:

        # -------------------------------------------------
        # USER
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM users

            WHERE id = %s

            LIMIT 1
        """, (user_id,))

        user = cursor.fetchone()

        if not user:

            return jsonify({
                "success": False,
                "message": "User not found"
            }), 404


        sensitive_fields = [
            'password',
            'password_hash',
            'reset_token',
            'verification_token',
            'oauth_token',
            'access_token'
        ]

        for field in sensitive_fields:

            user.pop(
                field,
                None
            )


        # -------------------------------------------------
        # API
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                id,
                user_id,
                name,
                created_at,
                last_used_at,
                expires_at,
                is_active

            FROM api_keys

            WHERE user_id = %s

            ORDER BY created_at DESC

            LIMIT 1
        """, (user_id,))

        api = cursor.fetchone()


        # -------------------------------------------------
        # DATASETS
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM datasets

            WHERE user_id = %s
              AND status = 'active'

            ORDER BY created_at DESC
        """, (user_id,))

        datasets = cursor.fetchall()


        # -------------------------------------------------
        # COPIES
        # -------------------------------------------------

        cursor.execute("""
            SELECT
                c.*,

                d.original_name AS original_dataset_name,
                d.updated_name AS original_updated_name

            FROM dataframe_copies c

            LEFT JOIN datasets d
                ON d.id = c.dataset_id
                AND d.user_id = c.user_id

            WHERE c.user_id = %s
              AND c.status = 'active'

            ORDER BY c.created_at DESC
        """, (user_id,))

        copies = cursor.fetchall()


        # -------------------------------------------------
        # MODELS
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM saved_models

            WHERE user_id = %s

            ORDER BY created_at DESC
        """, (user_id,))

        models = cursor.fetchall()


        for model in models:

            if isinstance(
                model.get("features"),
                str
            ):

                try:

                    model["features"] = json.loads(
                        model["features"]
                    )

                except Exception:
                    pass


            if isinstance(
                model.get("metrics"),
                str
            ):

                try:

                    model["metrics"] = json.loads(
                        model["metrics"]
                    )

                except Exception:
                    pass


        # -------------------------------------------------
        # ACTIVITY
        # -------------------------------------------------

        cursor.execute("""
            SELECT *
            FROM activity

            WHERE user_id = %s

            ORDER BY created_at DESC

            LIMIT 50
        """, (user_id,))

        activity = cursor.fetchall()


        # -------------------------------------------------
        # STORAGE
        # -------------------------------------------------

        storage = calculate_storage(
            cursor,
            user_id
        )


        # -------------------------------------------------
        # STATISTICS
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "user": user,

            "api": api,

            "datasets": datasets,

            "copies": copies,

            "models": models,

            "activity": activity,

            "storage": storage,

            "statistics": {

                "total_datasets":
                    len(datasets),

                "total_copies":
                    len(copies),

                "total_models":
                    len(models),

                "total_activity":
                    len(activity)

            }

        })

    finally:

        close_db(db, cursor)
