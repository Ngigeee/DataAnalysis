
from flask import Blueprint, render_template, session

# Create the Blueprint
pages_bp = Blueprint("pages", __name__)


# --------------------------------------------------
# HOME
# --------------------------------------------------
@pages_bp.route("/")
def myIndex():
    username = session.get("user", {}).get("username", "Guest")
    return render_template("dashboard.html", username=username)


@pages_bp.route("/home")
def home():
    username = session.get("user", {}).get("username", "Guest")
    return render_template("index.html", username=username)


# --------------------------------------------------
# AUTHENTICATION PAGES
# --------------------------------------------------
@pages_bp.route("/login")
def login_page():
    return render_template("login.html")


@pages_bp.route("/register")
def register_page():
    return render_template("register.html")


@pages_bp.route("/verify", methods=["GET"])
def verify_page():
    return render_template("verify.html")


@pages_bp.route("/forgot_password", methods=["GET"])
def forgot_password_page():
    return render_template("forgot_password.html")


@pages_bp.route("/reset_password", methods=["GET"])
def reset_password_page():
    return render_template("reset_password.html")


# --------------------------------------------------
# USER PAGES
# --------------------------------------------------
@pages_bp.route("/profile", methods=["GET"])
def profile():
    return render_template("profile.html")


@pages_bp.route("/account")
def account_page():
    return render_template("account.html")


@pages_bp.route("/settings", methods=["GET"])
def settings_page():
    return render_template("settings.html")


# --------------------------------------------------
# DATASET PAGES
# --------------------------------------------------
@pages_bp.route("/datasets")
def dataset_page():
    return render_template("datasets.html")


@pages_bp.route("/view_dataset")
def view_dataset_page():
    return render_template("view_dataset.html")


@pages_bp.route("/view_copy")
def view_copy_page():
    return render_template("view_copy.html")


# --------------------------------------------------
# MACHINE LEARNING MODEL PAGES
# --------------------------------------------------
@pages_bp.route("/models")
def model_page():
    return render_template("models.html")


@pages_bp.route("/view_model")
def view_model_page():
    return render_template("view_model.html")


@pages_bp.route("/run_model_page")
def run_model_page():
    return render_template("run_model.html")


# --------------------------------------------------
# INFORMATION PAGES
# --------------------------------------------------
@pages_bp.route("/about")
def about_page():
    return render_template("about.html")


@pages_bp.route("/help")
def help_page():
    return render_template("help.html")


@pages_bp.route("/contact")
def contact_page():
    return render_template("contact.html")


@pages_bp.route("/coming_soon", methods=["GET"])
def coming_page():
    return render_template("comingSoon.html")

