from flask import Blueprint, request, jsonify, session
from .config import get_db

themeauth_bp = Blueprint("themeauth", __name__)


# ----------------------------
# GET CURRENT THEME
# ----------------------------
@themeauth_bp.route("/get_theme", methods=["GET"])
def get_theme():

    try:

        # -----------------------------------------
        # Guest user
        # -----------------------------------------

        if "user" not in session:

            return jsonify({
                "success": False,
                "message": "User is not logged in.",
                "theme": "light"
            }), 200


        # -----------------------------------------
        # Logged in user
        # -----------------------------------------

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT theme
            FROM users
            WHERE id=%s
            """,
            (session["user"]["id"],)
        )

        user = cursor.fetchone()

        cursor.close()
        conn.close()


        return jsonify({
            "success": True,
            "theme": user["theme"] if user else "light"
        })


    except Exception as e:

        print("Theme error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to load saved theme.",
            "theme": "light"
        }), 500


# ----------------------------
# UPDATE THEME
# ----------------------------
@themeauth_bp.route("/update_theme", methods=["POST"])
def update_theme():

    try:

        if "user" not in session:
            return jsonify({
                "success": False,
                "error": "Not logged in"
            }), 401

        data = request.get_json()

        theme = data.get("theme")

        if theme not in ["light", "dark"]:
            return jsonify({
                "success": False,
                "error": "Invalid theme"
            }), 400

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE users
            SET theme=%s
            WHERE id=%s
            """,
            (
                theme,
                session["user"]["id"]
            )
        )

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "theme": theme
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
