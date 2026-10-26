from flask import Flask, render_template, request, jsonify,session
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import (r2_score, mean_squared_error)
import secrets
import io
import json
import os
import joblib
import uuid
import pandas as pd
import numpy as np

#--reusable--variables
from routes.shared_state import (
    RUNNED_MODELS_CACHE,
    MODEL_DIR,
    UPLOAD_FOLDER
)

#-----callviews
from routes.viewPages import pages_bp
#--end--

#--dataexploration--
from routes.data_exploration import dataset_analysis_bp
#end

#--datacleaning--
from routes.data_cleaning_routes import data_cleaning_bp
#--end

#--dataset--addition--functions
from routes.dataset_structure_routes import dataset_structure_bp
#--end

#--run--save-model--
from routes.model_training_routes import model_training_bp
#--end

#--upload--activedataframe--updatecell
from routes.dataset_operations_routes import dataset_operations_bp
#--end

#export--visualize--get-model
from routes.export_visualization_routes import export_visualization_bp
#--end

#----- helper functions-----
from routes.loadActiveDataset import get_active_dataframe, save_active_dataframe
#------end------

# -----models routes
from routes.models.linearRegression import linearRegression
from routes.models.logisticRegression import logisticRegression
#------end------

from routes.login import auth_bp, oauth
from routes.config import get_db
from routes.saveCopy import saveCopies_bp 
from routes.loadDatasetandCopy import loadDataset_bp
from routes.getAllcopies import viewCopies_bp
from routes.getDatasetsofLogged import datasets_bp
from routes.rename_dataset import renamedatasets_bp
from routes.changeTheme import themeauth_bp
from routes.dataVisualization import dataVisualize_bp 
from routes.overview import overview_bp

# profile page routes
from routes.profile.profile_details import profile_details_bp
from routes.profile.copy_management import copy_management_bp
from routes.profile.dataset_management import dataset_management_bp
from routes.profile.model_management import model_management_bp
from routes.profile.full_profile import full_profile_bp 
from routes.profile.profile_data import profile_data_bp
#playerrating
from routes.player_rating import player_rating_bp 


app = Flask(__name__)






def generate_secret_key():
    key = os.environ.get("FLASK_SECRET_KEY")

    if not key:
        key = secrets.token_hex(32)

    return key  # 64-character random key

app.secret_key = generate_secret_key()

oauth.init_app(app)

# Global dataframe (for a single-user demo)
df = pd.DataFrame()


#calltheviews
app.register_blueprint(pages_bp)

#--dataexploration--
app.register_blueprint(dataset_analysis_bp)

#--data--cleaning
app.register_blueprint(data_cleaning_bp)

#--run--save-model--
app.register_blueprint(model_training_bp)

#--upload--activedataframe--updatecell
app.register_blueprint(dataset_operations_bp)

#export--visualize--get-model
app.register_blueprint(export_visualization_bp)

#call--more--functions
app.register_blueprint(dataset_structure_bp)

#call the home routes
app.register_blueprint(auth_bp)
app.register_blueprint(saveCopies_bp)
app.register_blueprint(loadDataset_bp)
app.register_blueprint(viewCopies_bp)
app.register_blueprint(datasets_bp)
app.register_blueprint(renamedatasets_bp)
app.register_blueprint(themeauth_bp)
app.register_blueprint(dataVisualize_bp)
app.register_blueprint(overview_bp)

#call the profile routes

app.register_blueprint(profile_details_bp)
app.register_blueprint(copy_management_bp)
app.register_blueprint(dataset_management_bp)
app.register_blueprint(model_management_bp)
app.register_blueprint(full_profile_bp)
app.register_blueprint(profile_data_bp)

#callplayerratings
app.register_blueprint(player_rating_bp)


if __name__ == "__main__":
    app.run(debug=True)
