
import os
import json
import joblib
import pandas as pd
import traceback

from flask import (
    Blueprint,
    redirect,
    url_for,
    jsonify,
    request,
    render_template,
)

from routes.config import get_db
from routes.profile.profile_details import (
    get_logged_in_user_id,
    close_db,
)


model_management_bp = Blueprint(
    "model_management",
    __name__
)


# =========================================================
# VIEW MODEL
# GET /try_model/<model_id>
# =========================================================

@model_management_bp.route(
    "/try_model/<int:model_id>",
    methods=["GET"]
)
def try_model(model_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return redirect(url_for("login"))

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

        # FEATURES
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

        # METRICS
        metrics = model.get("metrics")

        if isinstance(metrics, str):
            try:
                metrics = json.loads(metrics)
            except Exception:
                metrics = {}

        # NAME
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
# POST /try_model/<model_id>/run
# =========================================================

@model_management_bp.route(
    "/try_model/<int:model_id>/run",
    methods=["POST"]
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

        # LOAD FEATURES
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

        # INPUT
        payload = request.get_json(silent=True)

        if not payload:
            payload = request.form.to_dict()

        # CHECK ALL FEATURES
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

        # LOAD SAVED MODEL
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

        # LOAD PICKLE
        trained_model = joblib.load(model_path)

        # PREPARE INPUT
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

        # PREDICT
        prediction = trained_model.predict(input_df)

        result = prediction[0]

        # Convert numpy values to Python
        if hasattr(result, "item"):
            result = result.item()

        # RESPONSE
        return jsonify({
            "success": True,
            "model_id": model_id,
            "model_name": model.get("name"),
            "target": model.get("target"),
            "features": features,
            "prediction": result
        })

    except Exception as e:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        close_db(db, cursor)


# =========================================================
# RENAME MODEL
# POST /models/<model_id>/rename
# =========================================================

@model_management_bp.route(
    "/models/<int:model_id>/rename",
    methods=["POST"]
)
def rename_model(model_id):

    user_id = get_logged_in_user_id()

    if user_id is None:
        return jsonify({
            "success": False,
            "message": "Please log in."
        }), 401

    data = request.get_json(silent=True) or request.form

    name = str(data.get("name", "")).strip()

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
        # GET MODEL
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

        # UPDATE MODEL NAME
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

        # RECORD ACTIVITY
        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                entity_type,
                entity_id
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            "model_renamed",
            f"Renamed model from '{old_name}' to '{name}'",
            "model",
            model_id
        ))

        # COMMIT
        db.commit()

        return jsonify({
            "success": True,
            "message": "Model renamed successfully.",
            "model_id": model_id,
            "name": name
        })

    except Exception as e:
        db.rollback()

        print("Rename model error:", e)

        return jsonify({
            "success": False,
            "message": "Failed to rename model."
        }), 500

    finally:
        close_db(db, cursor)


# =========================================================
# DELETE MODEL
# POST /models/<model_id>/delete
# =========================================================

@model_management_bp.route(
    "/models/<int:model_id>/delete",
    methods=["POST"]
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
        # GET MODEL
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

        model_name = model.get("name") or "Unnamed Model"
        file_path = model.get("file_path")

        # DELETE MODEL FILE
        if file_path:
            try:
                if os.path.isfile(file_path):
                    os.remove(file_path)
            except OSError:
                # Continue if the physical file is missing.
                pass

        # DELETE DATABASE RECORD
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

        # ADD ACTIVITY
        cursor.execute("""
            INSERT INTO activity (
                user_id,
                action,
                description,
                created_at
            )
            VALUES (%s, %s, %s, NOW())
        """, (
            user_id,
            "delete_model",
            f'Deleted model "{model_name}"'
        ))

        # COMMIT
        db.commit()

        return jsonify({
            "success": True,
            "message": "Model deleted successfully.",
            "model_id": model_id
        })

    except Exception as e:
        db.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        close_db(db, cursor)
