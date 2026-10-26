import os
import secrets
import hashlib
import smtplib
import joblib

from datetime import datetime, timedelta
from email.message import EmailMessage

from flask import Blueprint, request, jsonify, session, redirect

# Change this import to wherever your existing get_db() lives
from .config import get_db


player_rating_bp = Blueprint(
    "player_rating",
    __name__,
    url_prefix="/api/player"
)


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_PATH = os.environ.get(
    "PLAYER_RATING_MODEL",
    "models/player_rating_model.pkl"
)

TOKEN_EXPIRY_MINUTES = 15

FEATURES = [
    "crossing",
    "dribbling",
    "ball_control",
    "shot_power",
    "aggression",
    "finishing",
    "freekick_accuracy",
    "sprint_speed",
    "strength"
]


# ============================================================
# LOAD MODEL
# ============================================================

_model = None


def get_model():
    global _model

    if _model is None:
        _model = joblib.load(MODEL_PATH)

    return _model


# ============================================================
# TOKEN HELPERS
# ============================================================

def hash_token(token):
    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


def generate_token():
    """
    Generates a cryptographically secure token.

    Example:
    /player/verify/7f2c8a9...
    """

    return secrets.token_urlsafe(48)


# ============================================================
# EMAIL
# ============================================================


def send_verification_email(to_email, nickname, verification_url):

    msg = EmailMessage()

    msg.set_content(
        f"""Hello {nickname},

Welcome to the Player Rating Predictor.

Click the link below to verify your profile:

{verification_url}

This link expires in 15 minutes.

You do not need a password to use the system.

If you did not request this, you can safely ignore this email.

Player Rating Predictor
"""
    )

    msg["Subject"] = "Verify Your Player Rating Profile"
    msg["From"] = os.getenv("MAIL_USERNAME")
    msg["To"] = to_email

    with smtplib.SMTP_SSL(
        os.getenv("MAIL_SERVER"),
        int(os.getenv("MAIL_PORT", 465))
    ) as server:

        server.login(
            os.getenv("MAIL_USERNAME"),
            os.getenv("MAIL_PASSWORD")
        )

        server.send_message(msg)



# ============================================================
# PARTICIPANT
# GET CURRENT USER
# ============================================================

@player_rating_bp.route("/me", methods=["GET"])
def current_participant():

    participant_id = session.get(
        "participant_id"
    )

    if not participant_id:

        return jsonify({
            "authenticated": False
        }), 401


    db = get_db()

    cursor = db.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            id,
            username,
            nickname,
            email,
            email_verified
        FROM participants
        WHERE id = %s
        """,
        (participant_id,)
    )

    participant = cursor.fetchone()

    cursor.close()

    if not participant:

        session.pop(
            "participant_id",
            None
        )

        return jsonify({
            "authenticated": False
        }), 401


    return jsonify({
        "authenticated": True,
        "id": participant["id"],
        "username": participant["username"],
        "nickname": participant["nickname"],
        "email": participant["email"]
    })


# ============================================================
# REQUEST VERIFICATION EMAIL
# ============================================================

@player_rating_bp.route(
    "/request-verification",
    methods=["POST"]
)
def request_verification():

    data = request.get_json(
        silent=True
    ) or {}


    username = str(
        data.get("username", "")
    ).strip()

    nickname = str(
        data.get("nickname", "")
    ).strip()

    email = str(
        data.get("email", "")
    ).strip().lower()


    # --------------------------------------------------------
    # BASIC VALIDATION
    # --------------------------------------------------------

    if not username:

        return jsonify({
            "message": "Username is required."
        }), 400


    if not nickname:

        return jsonify({
            "message": "Nickname is required."
        }), 400


    if not email or "@" not in email:

        return jsonify({
            "message": "A valid email address is required."
        }), 400


    if len(username) > 50:

        return jsonify({
            "message": "Username is too long."
        }), 400


    if len(nickname) > 100:

        return jsonify({
            "message": "Nickname is too long."
        }), 400


    # --------------------------------------------------------
    # DATABASE
    # --------------------------------------------------------

    db = get_db()

    cursor = db.cursor(
        dictionary=True
    )


    # Check whether email already exists

    cursor.execute(
        """
        SELECT id, username, nickname
        FROM participants
        WHERE email = %s
        """,
        (email,)
    )

    existing = cursor.fetchone()


    if existing:

        participant_id = existing["id"]

        # Update display information if desired

        cursor.execute(
            """
            UPDATE participants
            SET username = %s,
                nickname = %s
            WHERE id = %s
            """,
            (
                username,
                nickname,
                participant_id
            )
        )

    else:

        cursor.execute(
            """
            INSERT INTO participants
            (
                username,
                nickname,
                email,
                email_verified
            )
            VALUES
            (
                %s,
                %s,
                %s,
                FALSE
            )
            """,
            (
                username,
                nickname,
                email
            )
        )

        participant_id = cursor.lastrowid


    # --------------------------------------------------------
    # INVALIDATE OLD TOKENS
    # --------------------------------------------------------

    cursor.execute(
        """
        UPDATE verification_tokens
        SET used = TRUE
        WHERE participant_id = %s
        AND used = FALSE
        """,
        (participant_id,)
    )


    # --------------------------------------------------------
    # CREATE NEW TOKEN
    # --------------------------------------------------------

    raw_token = generate_token()

    token_hash = hash_token(
        raw_token
    )

    expires_at = (
        datetime.utcnow()
        + timedelta(
            minutes=TOKEN_EXPIRY_MINUTES
        )
    )


    cursor.execute(
        """
        INSERT INTO verification_tokens
        (
            participant_id,
            token_hash,
            expires_at,
            used
        )
        VALUES
        (
            %s,
            %s,
            %s,
            FALSE
        )
        """,
        (
            participant_id,
            token_hash,
            expires_at
        )
    )


    db.commit()

    cursor.close()


    # --------------------------------------------------------
    # BUILD VERIFICATION URL
    # --------------------------------------------------------

    base_url = os.environ.get(
        "PLAYER_RATING_BASE_URL",
        request.host_url.rstrip("/")
    )


    verification_url = (
        f"{base_url}"
        f"/api/player/verify/"
        f"{raw_token}"
    )


    # --------------------------------------------------------
    # SEND EMAIL
    # --------------------------------------------------------

    try:

        send_verification_email(
            email,
            nickname,
            verification_url
        )

    except Exception as error:

        print(
            "EMAIL ERROR:",
            error
        )

        return jsonify({
            "message":
                "Could not send verification email."
        }), 500


    return jsonify({
        "success": True,
        "message":
            "Verification link sent to your email."
    })


# ============================================================
# VERIFY TOKEN
# ============================================================

@player_rating_bp.route(
    "/verify/<token>",
    methods=["GET"]
)
def verify_token(token):

    if not token:

        return jsonify({
            "message": "Invalid verification link."
        }), 400


    token_hash = hash_token(token)


    db = get_db()

    cursor = db.cursor(
        dictionary=True
    )


    cursor.execute(
        """
        SELECT
            id,
            participant_id,
            expires_at,
            used
        FROM verification_tokens
        WHERE token_hash = %s
        LIMIT 1
        """,
        (token_hash,)
    )

    token_record = cursor.fetchone()


    if not token_record:

        cursor.close()

        return """
        <h2>Invalid verification link</h2>
        <p>This verification link does not exist.</p>
        """, 400


    if token_record["used"]:

        cursor.close()

        return """
        <h2>Link already used</h2>
        <p>This verification link has already been used.</p>
        """, 400


    # --------------------------------------------------------
    # CHECK EXPIRATION
    # --------------------------------------------------------

    if token_record["expires_at"] < datetime.utcnow():

        cursor.close()

        return """
        <h2>Link expired</h2>
        <p>Please request a new verification link.</p>
        """, 400


    participant_id = (
        token_record["participant_id"]
    )


    # --------------------------------------------------------
    # VERIFY PARTICIPANT
    # --------------------------------------------------------

    cursor.execute(
        """
        UPDATE participants
        SET email_verified = TRUE
        WHERE id = %s
        """,
        (participant_id,)
    )


    # --------------------------------------------------------
    # MARK TOKEN USED
    # --------------------------------------------------------

    cursor.execute(
        """
        UPDATE verification_tokens
        SET used = TRUE
        WHERE id = %s
        """,
        (token_record["id"],)
    )


    db.commit()

    cursor.close()


    # --------------------------------------------------------
    # CREATE SESSION
    # --------------------------------------------------------

    session["participant_id"] = participant_id


    # --------------------------------------------------------
    # REDIRECT TO PAGE
    # --------------------------------------------------------

    frontend_url = os.environ.get(
        "PLAYER_RATING_PAGE",
        "/player-rating"
    )


    return redirect(
        frontend_url
    )


# ============================================================
# PREDICT RATING
# ============================================================

@player_rating_bp.route(
    "/predict",
    methods=["POST"]
)
def predict_rating():

    participant_id = session.get(
        "participant_id"
    )


    if not participant_id:

        return jsonify({
            "message":
                "Please verify your email first."
        }), 401


    data = request.get_json(
        silent=True
    ) or {}


    values = {}


    # --------------------------------------------------------
    # VALIDATE FEATURES
    # --------------------------------------------------------

    for feature in FEATURES:

        if feature not in data:

            return jsonify({
                "message":
                    f"Missing feature: {feature}"
            }), 400


        try:

            value = float(
                data[feature]
            )

        except (
            ValueError,
            TypeError
        ):

            return jsonify({
                "message":
                    f"{feature} must be a number."
            }), 400


        if value < 0 or value > 100:

            return jsonify({
                "message":
                    f"{feature} must be between 0 and 100."
            }), 400


        values[feature] = value


    # --------------------------------------------------------
    # RUN MODEL
    # --------------------------------------------------------

    model = get_model()


    model_input = [[
        values["crossing"],
        values["dribbling"],
        values["ball_control"],
        values["shot_power"],
        values["aggression"],
        values["finishing"],
        values["freekick_accuracy"],
        values["sprint_speed"],
        values["strength"]
    ]]


    prediction = model.predict(
        model_input
    )[0]


    predicted_rating = round(
        float(prediction),
        2
    )


    # Optional safety boundary

    predicted_rating = max(
        0,
        min(
            100,
            predicted_rating
        )
    )


    # --------------------------------------------------------
    # GET PARTICIPANT
    # --------------------------------------------------------

    db = get_db()

    cursor = db.cursor(
        dictionary=True
    )


    cursor.execute(
        """
        SELECT nickname
        FROM participants
        WHERE id = %s
        """,
        (participant_id,)
    )

    participant = cursor.fetchone()


    if not participant:

        cursor.close()

        return jsonify({
            "message": "Participant not found."
        }), 404


    # --------------------------------------------------------
    # SAVE PREDICTION
    # --------------------------------------------------------

    cursor.execute(
        """
        INSERT INTO predictions
        (
            participant_id,
            crossing,
            dribbling,
            ball_control,
            shot_power,
            aggression,
            finishing,
            freekick_accuracy,
            sprint_speed,
            strength,
            predicted_rating
        )
        VALUES
        (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s
        )
        """,
        (
            participant_id,
            values["crossing"],
            values["dribbling"],
            values["ball_control"],
            values["shot_power"],
            values["aggression"],
            values["finishing"],
            values["freekick_accuracy"],
            values["sprint_speed"],
            values["strength"],
            predicted_rating
        )
    )


    prediction_id = cursor.lastrowid

    db.commit()

    cursor.close()


    return jsonify({
        "success": True,
        "prediction_id": prediction_id,
        "overall_rating": predicted_rating,
        "nickname": participant["nickname"]
    })


# ============================================================
# LEADERBOARD
# ============================================================

@player_rating_bp.route(
    "/leaderboard",
    methods=["GET"]
)
def leaderboard():

    db = get_db()

    cursor = db.cursor(
        dictionary=True
    )


    cursor.execute(
        """
        SELECT
            p.id,
            p.nickname,
            p.predicted_rating,

            COALESCE(
                SUM(
                    CASE
                        WHEN v.vote = 1
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS upvotes,

            COALESCE(
                SUM(
                    CASE
                        WHEN v.vote = -1
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS downvotes

        FROM predictions p

        LEFT JOIN prediction_votes v
            ON p.id = v.prediction_id

        GROUP BY
            p.id,
            p.nickname,
            p.predicted_rating

        ORDER BY
            p.predicted_rating DESC
        """
    )


    players = cursor.fetchall()

    cursor.close()


    for player in players:

        player["upvotes"] = int(
            player["upvotes"]
        )

        player["downvotes"] = int(
            player["downvotes"]
        )

        player["flagged"] = (
            player["downvotes"]
            > player["upvotes"]
        )


    return jsonify(players)


# ============================================================
# GET ONE PLAYER / PREDICTION
# ============================================================

@player_rating_bp.route(
    "/<int:prediction_id>",
    methods=["GET"]
)
def get_prediction(prediction_id):

    db = get_db()

    cursor = db.cursor(
        dictionary=True
    )


    cursor.execute(
        """
        SELECT
            p.id,
            u.nickname,

            p.crossing,
            p.dribbling,
            p.ball_control,
            p.shot_power,
            p.aggression,
            p.finishing,
            p.freekick_accuracy,
            p.sprint_speed,
            p.strength,

            p.predicted_rating,

            COALESCE(
                SUM(
                    CASE
                        WHEN v.vote = 1
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS upvotes,

            COALESCE(
                SUM(
                    CASE
                        WHEN v.vote = -1
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS downvotes

        FROM predictions p

        INNER JOIN participants u
            ON p.participant_id = u.id

        LEFT JOIN prediction_votes v
            ON p.id = v.prediction_id

        WHERE p.id = %s

        GROUP BY
            p.id,
            u.nickname,
            p.crossing,
            p.dribbling,
            p.ball_control,
            p.shot_power,
            p.aggression,
            p.finishing,
            p.freekick_accuracy,
            p.sprint_speed,
            p.strength,
            p.predicted_rating
        """,
        (prediction_id,)
    )


    player = cursor.fetchone()

    cursor.close()


    if not player:

        return jsonify({
            "message":
                "Prediction not found."
        }), 404


    player["upvotes"] = int(
        player["upvotes"]
    )

    player["downvotes"] = int(
        player["downvotes"]
    )

    player["flagged"] = (
        player["downvotes"]
        > player["upvotes"]
    )


    return jsonify(player)


# ============================================================
# VOTE
# ============================================================

@player_rating_bp.route(
    "/vote",
    methods=["POST"]
)
def vote():

    participant_id = session.get(
        "participant_id"
    )


    if not participant_id:

        return jsonify({
            "message":
                "Please verify your email first."
        }), 401


    data = request.get_json(
        silent=True
    ) or {}


    try:

        prediction_id = int(
            data.get("prediction_id")
        )

        vote_value = int(
            data.get("vote")
        )

    except (
        ValueError,
        TypeError
    ):

        return jsonify({
            "message":
                "Invalid vote data."
        }), 400


    if vote_value not in [1, -1]:

        return jsonify({
            "message":
                "Vote must be 1 or -1."
        }), 400


    db = get_db()

    cursor = db.cursor(
        dictionary=True
    )


    # --------------------------------------------------------
    # CHECK PREDICTION
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT id
        FROM predictions
        WHERE id = %s
        """,
        (prediction_id,)
    )

    prediction = cursor.fetchone()


    if not prediction:

        cursor.close()

        return jsonify({
            "message":
                "Prediction not found."
        }), 404


    # --------------------------------------------------------
    # PREVENT USER VOTING ON OWN SUBMISSION
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT participant_id
        FROM predictions
        WHERE id = %s
        """,
        (prediction_id,)
    )

    owner = cursor.fetchone()


    if owner["participant_id"] == participant_id:

        cursor.close()

        return jsonify({
            "message":
                "You cannot vote on your own submission."
        }), 400


    # --------------------------------------------------------
    # CHECK EXISTING VOTE
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT id, vote
        FROM prediction_votes
        WHERE prediction_id = %s
        AND participant_id = %s
        """,
        (
            prediction_id,
            participant_id
        )
    )

    existing_vote = cursor.fetchone()


    if existing_vote:

        # Allow changing the vote

        if existing_vote["vote"] == vote_value:

            cursor.close()

            return jsonify({
                "message":
                    "You have already cast this vote."
            }), 400


        cursor.execute(
            """
            UPDATE prediction_votes
            SET vote = %s
            WHERE id = %s
            """,
            (
                vote_value,
                existing_vote["id"]
            )
        )

    else:

        cursor.execute(
            """
            INSERT INTO prediction_votes
            (
                prediction_id,
                participant_id,
                vote
            )
            VALUES
            (
                %s,
                %s,
                %s
            )
            """,
            (
                prediction_id,
                participant_id,
                vote_value
            )
        )


    db.commit()


    # --------------------------------------------------------
    # GET UPDATED COUNTS
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT

            COALESCE(
                SUM(
                    CASE
                        WHEN vote = 1
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS upvotes,

            COALESCE(
                SUM(
                    CASE
                        WHEN vote = -1
                        THEN 1
                        ELSE 0
                    END
                ),
                0
            ) AS downvotes

        FROM prediction_votes

        WHERE prediction_id = %s
        """,
        (prediction_id,)
    )


    counts = cursor.fetchone()

    cursor.close()


    upvotes = int(
        counts["upvotes"]
    )

    downvotes = int(
        counts["downvotes"]
    )


    return jsonify({

        "success": True,

        "upvotes": upvotes,

        "downvotes": downvotes,

        "flagged":
            downvotes > upvotes

    })
