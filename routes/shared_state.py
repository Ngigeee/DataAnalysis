import os

RUNNED_MODELS_CACHE = {}
UPLOAD_FOLDER = "datasets"
MODEL_DIR = "saved_models"

os.makedirs(MODEL_DIR, exist_ok=True)