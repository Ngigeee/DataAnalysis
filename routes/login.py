from flask import Blueprint, request, jsonify, session, redirect, url_for, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from .config import get_db
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import random
from datetime import datetime, timedelta
import smtplib
from email.message import EmailMessage
import os


auth_bp = Blueprint("auth", __name__)


def send_verification_email(to_email, code):
    msg = EmailMessage()
    msg.set_content(f"Your Kijarney verification code is: {code}\nThis code expires in 15 minutes.")
    msg["Subject"] = "Verify Your Kijarney Account"
    msg["From"] = os.getenv("MAIL_USERNAME")
    msg["To"] = to_email

    with smtplib.SMTP_SSL(os.getenv("MAIL_SERVER"), int(os.getenv("MAIL_PORT", 465))) as server:
        server.login(os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD"))
        server.send_message(msg)

# Initialize OAuth (ensure `oauth` is configured in your main app file and imported or passed accordingly)
oauth = OAuth()

# ==========================
# GOOGLE LOGIN
# ==========================

google = oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"}
)

@auth_bp.route("/auth/google/register")
def google_register():
    redirect_uri = url_for(
        "auth.register_google_callback",
        _external=True
    )
    return google.authorize_redirect(redirect_uri)
     
@auth_bp.route("/auth/google/login")
def google_login():
    redirect_uri = url_for(
        "auth.login_google_callback",
        _external=True
    )
    return google.authorize_redirect(redirect_uri)
     
@auth_bp.route("/auth/google/register/callback")
def register_google_callback():
    try:
        token = google.authorize_access_token()
        user = token.get("userinfo")
        if not user:
            return jsonify({
                "success": False,
                "error": "Failed to fetch user info from Google"
            }), 400
         
        username = user.get("name") or user.get("email").split("@")[0]
        email = user.get("email")
        google_id = user.get("sub")

        if not username or not email or not google_id:
            return jsonify({
                "success": False,
                "error": "All fields required from Google profile"
            })

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # Check existing user
        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email=%s OR username=%s
            """,
            (email, username)
        )

        existing = cursor.fetchone()

        if existing:
            cursor.close()
            conn.close()

            return jsonify({
                "success": False,
                "error": "Username or email already exists"
            })

        cursor.execute(
            """
            INSERT INTO users
            (
                username,
                email,
                google_id,
                verified
            )
            VALUES (%s, %s, %s, 1)
            """,
            (username, email, google_id)
        )

        conn.commit()
        cursor.close()
        conn.close()

        return redirect(url_for("home"))

    except Exception as e:
        print(e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
     
# ==========================
# GOOGLE LOGIN CALLBACK
# ==========================
@auth_bp.route("/auth/google/login/callback")
def login_google_callback():
    try:
        token = google.authorize_access_token()
        user_info = token.get("userinfo")
        if not user_info:
            return jsonify({
                "success": False,
                "error": "Failed to fetch user info from Google"
            }), 400

        email = user_info.get("email")

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT 
                id,
                username,
                email,
                verified,
                COALESCE(theme, 'light') AS theme
            FROM users
            WHERE email=%s
            """,
            (email,)
        )

        user = cursor.fetchone()

        cursor.close()
        conn.close()

        if not user:
            return jsonify({
                "success": False,
                "error": "No account associated with this Google email. Please register first."
            })

        # CREATE SESSION WITH USER PREFERENCES
        session["user"] = {
            "id": user["id"],
            "username": user["username"],
            "theme": user["theme"]
        }

        return redirect(url_for("home"))

    except Exception as e:
        print(e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
        
        
# ==========================
# verify registered  user
# ==========================
@auth_bp.route("/verify", methods=["POST"])
def verify_code():
    try:
        data = request.get_json()
        code = data.get("code")
        email = session.get("pending_email") or data.get("email")

        if not code or not email:
            return jsonify({
                "success": False,
                "error": "Verification code and email are required"
            })

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, verification_code, verification_expiry 
            FROM users 
            WHERE email=%s
            """,
            (email,)
        )
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "error": "User not found"})

        if str(user["verification_code"]) != str(code):
            cursor.close()
            conn.close()
            return jsonify({"success": False, "error": "Invalid verification code"})

        if datetime.now() > user["verification_expiry"]:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "error": "Verification code has expired"})

        # Update user to verified and clear code/expiry
        cursor.execute(
            """
            UPDATE users 
            SET verified = 1, verification_code = NULL, verification_expiry = NULL 
            WHERE email = %s
            """,
            (email,)
        )
        conn.commit()
        cursor.close()
        conn.close()

        # Clear pending session and log user in
        session.pop("pending_email", None)

        return jsonify({
            "success": True,
            "redirect": url_for("home")
        })

    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500
# ==========================
# REGISTER
# ==========================

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")

        if not username or not email or not password:
            return jsonify({
                "success": False,
                "error": "All fields required"
            })

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT id FROM users WHERE email=%s OR username=%s",
            (email, username)
        )
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({
                "success": False,
                "error": "Username or email already exists"
            })

        hashed_password = generate_password_hash(password)
        
        # Generate 6-digit code and 15-minute expiry
        verification_code = f"{random.randint(100000, 999999)}"
        verification_expiry = datetime.now() + timedelta(minutes=15)

        cursor.execute(
            """
            INSERT INTO users
            (username, email, password, verified, verification_code, verification_expiry)
            VALUES (%s, %s, %s, 0, %s, %s)
            """,
            (username, email, hashed_password, verification_code, verification_expiry)
        )
        conn.commit()
        cursor.close()
        conn.close()

        # Send email
        send_verification_email(email, verification_code)

        # Store email in session temporarily for verification step
        session["pending_email"] = email

        return jsonify({
            "success": True,
            "redirect": url_for("auth.verify_page")
        })

    except Exception as e:
        print(e)
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500



# ==========================
# LOGIN
# ==========================

@auth_bp.route("/login_user", methods=["POST"])
def login():

    try:

        data = request.get_json()

        email = data.get("email")
        password = data.get("password")


        conn = get_db()

        cursor = conn.cursor(dictionary=True)


        cursor.execute(
            """
            SELECT 
                id,
                username,
                email,
                password,
                verified,
                is_premium,
                created_at,
                COALESCE(theme, 'light') AS theme
            FROM users
            WHERE email=%s
            """,
            (email,)
        )


        user = cursor.fetchone()


        cursor.close()
        conn.close()



        if not user:

            return jsonify({
                "success": False,
                "error": "User not registered"
            })



        if not check_password_hash(
            user["password"],
            password
        ):

            return jsonify({
                "success": False,
                "error": "Invalid password"
            })


        if user["verified"] != 1:

            return jsonify({
                "success": False,
                "error": "Account not verified. Please verify your account first."
            })



        # CREATE SESSION WITH USER PREFERENCES

        session["user"] = {
            "id": user["id"],
            "username": user["username"],
            "theme": user["theme"]
        }


        return jsonify({

            "success": True,
            "redirect": url_for("pages.home"),
            "loggedin_id": user["id"],
            "username": user["username"],
            "is_premium": user["is_premium"],
            "verified": user["verified"],
            "email": user["email"],
            "created_at": user["created_at"],
            "theme": user["theme"],

        })



    except Exception as e:

        print(e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ==========================
# FORGOT / RESET PASSWORD
# ==========================



@auth_bp.route("/forgot_password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({"success": False, "error": "Email is required"})

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id FROM users WHERE email=%s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            # For security, don't reveal if email exists, or return success message anyway
            return jsonify({"success": True, "message": "If the email exists, a reset code has been sent."})

        # Generate 6-digit code and 15-minute expiry
        reset_code = f"{random.randint(100000, 999999)}"
        reset_expiry = datetime.now() + timedelta(minutes=15)

        cursor.execute(
            """
            UPDATE users 
            SET verification_code = %s, verification_expiry = %s 
            WHERE email = %s
            """,
            (reset_code, reset_expiry, email)
        )
        conn.commit()
        cursor.close()
        conn.close()

        # Send email with reset code
        msg = EmailMessage()
        msg.set_content(f"Your Kijarney password reset code is: {reset_code}\nThis code expires in 15 minutes.")
        msg["Subject"] = "Password Reset Request"
        msg["From"] = os.getenv("MAIL_USERNAME")
        msg["To"] = email

        with smtplib.SMTP_SSL(os.getenv("MAIL_SERVER"), int(os.getenv("MAIL_PORT", 465))) as server:
            server.login(os.getenv("MAIL_USERNAME"), os.getenv("MAIL_PASSWORD"))
            server.send_message(msg)

        session["reset_email"] = email

        return jsonify({
            "success": True,
            "redirect": url_for("auth.reset_password_page")
        })

    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500





@auth_bp.route("/reset_password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
        code = data.get("code")
        new_password = data.get("password")
        email = session.get("reset_email") or data.get("email")

        if not code or not new_password or not email:
            return jsonify({"success": False, "error": "All fields are required"})

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT id, verification_code, verification_expiry 
            FROM users 
            WHERE email=%s
            """,
            (email,)
        )
        user = cursor.fetchone()

        if not user or str(user["verification_code"]) != str(code):
            cursor.close()
            conn.close()
            return jsonify({"success": False, "error": "Invalid reset code"})

        if datetime.now() > user["verification_expiry"]:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "error": "Reset code has expired"})

        hashed_password = generate_password_hash(new_password)

        cursor.execute(
            """
            UPDATE users 
            SET password = %s, verified = 1, verification_code = NULL, verification_expiry = NULL 
            WHERE email = %s
            """,
            (hashed_password, email)
        )
        conn.commit()
        cursor.close()
        conn.close()

        session.pop("reset_email", None)

        return jsonify({
            "success": True,
            "redirect": url_for("auth.login") # adjust if your login route differs
        })

    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500

# ==========================
# LOGOUT
# ==========================



@auth_bp.route("/logout")
def logout():

    session.clear()

    return redirect(url_for("home"))
