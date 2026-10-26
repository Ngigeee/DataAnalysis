from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error


def linearRegression(
    df,
    features,
    target,
    test_size=0.2,
    random_state=42
):

    # -------------------------
    # GET FEATURES AND TARGET
    # -------------------------

    model_data = df[
        features + [target]
    ].dropna()

    X = model_data[features]

    y = model_data[target]


    # -------------------------
    # SPLIT DATA
    # -------------------------

    X_train, X_test, y_train, y_test = train_test_split(

        X,
        y,

        test_size=test_size,

        random_state=random_state

    )


    # -------------------------
    # CREATE MODEL
    # -------------------------

    model = LinearRegression()


    # -------------------------
    # TRAIN MODEL
    # -------------------------

    model.fit(
        X_train,
        y_train
    )


    # -------------------------
    # PREDICTIONS
    # -------------------------

    predictions = model.predict(X_test)


    # -------------------------
    # MODEL PARAMETERS
    # -------------------------

    intercept = model.intercept_

    gradients = model.coef_


    # -------------------------
    # EVALUATION
    # -------------------------

    r2 = r2_score(
        y_test,
        predictions
    )

    mse = mean_squared_error(
        y_test,
        predictions
    )


    # -------------------------
    # INTERPRET R²
    # -------------------------

    if r2 >= 0.9:

        evaluation = "Excellent"

        evaluation_message = (
            "The model explains most of the variation "
            "in the target. The model has a very good fit "
            "to the data."
        )

        recommendation = (
            "The model appears to perform very well. "
            "You can consider using it for predictions, "
            "but always validate it with new data."
        )


    elif r2 >= 0.7:

        evaluation = "Good"

        evaluation_message = (
            "The model explains a large portion of the "
            "variation in the target. The model has a "
            "good predictive fit."
        )

        recommendation = (
            "The model is performing well, although "
            "testing it with new data is recommended."
        )


    elif r2 >= 0.5:

        evaluation = "Moderate"

        evaluation_message = (
            "The model explains some of the variation "
            "in the target, but other factors are also "
            "important."
        )

        recommendation = (
            "Consider trying additional features or "
            "another machine learning model to improve "
            "the predictions."
        )


    elif r2 >= 0:

        evaluation = "Poor"

        evaluation_message = (
            "The model explains very little of the "
            "variation in the target. Its predictions "
            "may not be reliable."
        )

        recommendation = (
            "Try adding more relevant features, "
            "cleaning the dataset, or using another "
            "machine learning model."
        )


    else:

        evaluation = "Very Poor"

        evaluation_message = (
            "The model performs worse than a simple "
            "baseline that predicts the average target "
            "value."
        )

        recommendation = (
            "This model is not suitable for this "
            "prediction task with the selected features. "
            "Try different features, clean the data, "
            "or choose another model."
        )


    # -------------------------
    # INTERPRET MSE
    # -------------------------

    mse_message = (
        "Mean Squared Error measures how far the "
        "model's predictions are from the actual values. "
        "Lower values generally indicate better predictions."
    )


    # -------------------------
    # RETURN RESULTS
    # -------------------------

    return {

        "success": True,

        "model": "Linear Regression",

        "model_type": "linear_regression",
        
        # IMPORTANT:
        # This is the actual trained sklearn model
        "model_object": model,


        # -------------------------
        # DYNAMIC METRICS FOR UI
        # -------------------------

        "metrics": {
            "R² Score": float(r2),
            "Mean Squared Error": float(mse)
        },


        # -------------------------
        # PERFORMANCE & EVALUATION
        # -------------------------

        "evaluation": evaluation,

        "evaluation_message":
            evaluation_message,

        "recommendation":
            recommendation,


        # -------------------------
        # INDIVIDUAL METRICS (Backward Compatibility)
        # -------------------------

        "r2_score": float(r2),

        "mse": float(mse),

        "mse_message":
            mse_message,


        # -------------------------
        # MODEL INFORMATION
        # -------------------------

        "intercept":
            float(intercept),

        "gradient":
            gradients.tolist(),


        # -------------------------
        # DATASET INFORMATION
        # -------------------------

        "features":
            features,

        "target":
            target,

        "training_rows":
            len(X_train),

        "testing_rows":
            len(X_test),


        # -------------------------
        # PREDICTIONS
        # -------------------------

        "predictions":
            predictions.tolist()

    }
