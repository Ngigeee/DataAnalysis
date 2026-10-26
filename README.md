# DataAnalysis

A Flask-based data analysis platform for uploading datasets, exploring data, cleaning data, creating visualizations, and working with machine learning models.

## Features

- Upload CSV and JSON datasets.
- Explore dataset rows, columns, data types, and statistical summaries.
- Detect and handle missing values and duplicate rows.
- Add, remove, and rename columns and rows.
- Create data visualizations.
- Train and manage machine learning models.
- Store datasets and related information in a database.

## Technology Stack

- **Backend:** Python and Flask
- **Data processing:** Pandas and NumPy
- **Machine learning:** Scikit-learn
- **Model persistence:** Joblib
- **Database:** MySQL
- **Frontend:** HTML, CSS, and JavaScript with Flask templates

## Requirements

- Python 3.13 recommended
- pip
- MySQL server
- Git

## Installation

Clone the repository:

```bash
git clone https://github.com/Ngigeee/DataAnalysis.git
cd DataAnalysis
```

Create a virtual environment:

```bash
python3.13 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## Configuration

Configure the environment variables required by the application. See `.env.example` for the template and `ARCHITECTURE.md` for an overview of the application structure.

Never commit real passwords, database credentials, OAuth secrets, or Flask secret keys.

## Running the Application

Activate the virtual environment:

```bash
source venv/bin/activate
```

Start the development server:

```bash
python -m flask --app app run --debug
```

Open `http://127.0.0.1:5000` in your browser.

Use debug mode only for local development, not production deployment.

## Project Structure

- `app.py` — creates the Flask application and registers Blueprints.
- `routes/` — contains authentication, database helpers, and other route modules.
- `dataset_operations_routes.py` — handles dataset upload, active dataset retrieval, and cell updates.
- `data_cleaning_routes.py` — provides dataset-cleaning operations.
- `dataset_exploration.py` — provides dataset inspection and exploration endpoints.
- `dataset_structure_routes.py` — handles dataset structure modifications.
- `model_training_routes.py` — handles model training and saving.
- `export_visualization_routes.py` — provides export, visualization, and model endpoints.
- `requirements.txt` — lists Python package dependencies.
- `templates/` and `static/` — contain frontend templates and static assets, if present.

## Architecture

The Flask application registers route modules as Blueprints. Route handlers use shared helper functions to access the active dataset, perform data operations, and interact with the database. Pandas and NumPy handle data processing, while Scikit-learn provides machine learning functionality.

See [ARCHITECTURE.md](ARCHITECTURE.md) for more details.

## Security

- Keep `.env` and all real credentials out of Git.
- Use a strong, persistent Flask secret key configured through the environment.
- Do not expose debug mode on a public server.
- Validate uploaded files and protect authenticated routes appropriately.

## License

Add your chosen license here before distributing the project.
