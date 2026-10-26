# Application Architecture

## Overview

DataAnalysis is a Python web application built with Flask. It separates application routes into Blueprints and uses data-processing and machine-learning libraries to support dataset analysis.

## Main Components

### 1. Application Entry Point

`app.py` initializes the Flask application, configures the application secret key, initializes OAuth, and registers the application's Blueprints.

### 2. Route Modules

Route modules group related endpoints by responsibility:

- Dataset exploration
- Data cleaning
- Dataset structure modifications
- Dataset uploads and active dataset operations
- Model training and saving
- Visualization and export
- Authentication, profiles, and dataset management

### 3. Data Processing

Pandas manages tabular datasets. NumPy supports numerical operations and handling invalid or missing values.

### 4. Machine Learning

Scikit-learn supplies machine-learning algorithms and evaluation tools. Joblib can serialize trained models for later use.

### 5. Database

The application uses database helper functions to access MySQL. The database stores application records, such as dataset metadata and user-related information, according to the configured schema.

### 6. Frontend

Flask templates and static assets provide the browser interface, where users interact with application routes.

## Request Flow

1. A browser sends an HTTP request to Flask.
2. Flask matches the URL and HTTP method to a registered route.
3. The route calls the relevant helper functions or data-processing libraries.
4. The application reads or updates the dataset or database as required.
5. Flask returns an HTML page, JSON response, or exported data to the browser.

## Configuration and Secrets

Configuration values should be supplied through environment variables or a local environment file supported by the application. Real credentials must not be stored in the repository.

## Development and Deployment

For local development, install the dependencies from `requirements.txt` and start the Flask development server.

For production, use a suitable production WSGI server, configure persistent secrets and database connectivity, disable debug mode, and apply appropriate authentication and upload protections.
