from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    roc_auc_score,
    log_loss
)


def logisticRegression(
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
    # VALIDATE TARGET
    # -------------------------

    unique_values = y.unique()

    if len(unique_values) != 2:

        raise ValueError(
            "Logistic Regression requires a binary target "
            "with exactly two unique values."
        )


    # -------------------------
    # CONVERT TARGET TO 0 AND 1
    # -------------------------

    target_mapping = None

    if set(unique_values) != {0, 1}:

        sorted_values = sorted(
            unique_values,
            key=lambda value: str(value)
        )

        target_mapping = {
            sorted_values[0]: 0,
            sorted_values[1]: 1
        }

        y = y.map(target_mapping)


    # -------------------------
    # SPLIT DATA
    # -------------------------

    X_train, X_test, y_train, y_test = train_test_split(

        X,
        y,

        test_size=test_size,

        random_state=random_state,

        stratify=y

    )


    # -------------------------
    # CREATE MODEL
    # -------------------------

    model = LogisticRegression(
        max_iter=1000
    )


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

    predictions = model.predict(
        X_test
    )


    # -------------------------
    # PREDICT PROBABILITIES
    # -------------------------

    probabilities = model.predict_proba(
        X_test
    )


    # Probability of class 1

    positive_probabilities = probabilities[:, 1]


    # -------------------------
    # MODEL PARAMETERS
    # -------------------------

    intercept = model.intercept_

    coefficients = model.coef_


    # -------------------------
    # EVALUATION
    # -------------------------

    accuracy = accuracy_score(
        y_test,
        predictions
    )


    precision = precision_score(
        y_test,
        predictions,
        zero_division=0
    )


    recall = recall_score(
        y_test,
        predictions,
        zero_division=0
    )


    f1 = f1_score(
        y_test,
        predictions,
        zero_division=0
    )


    # -------------------------
    # CONFUSION MATRIX
    # -------------------------

    cm = confusion_matrix(
        y_test,
        predictions
    )


    true_negative = int(cm[0][0])

    false_positive = int(cm[0][1])

    false_negative = int(cm[1][0])

    true_positive = int(cm[1][1])


    # -------------------------
    # ROC AUC
    # -------------------------

    roc_auc = roc_auc_score(
        y_test,
        positive_probabilities
    )


    # -------------------------
    # LOG LOSS
    # -------------------------

    loss = log_loss(
        y_test,
        probabilities
    )


    # -------------------------
    # INTERPRET ACCURACY
    # -------------------------

    if accuracy >= 0.9:

        evaluation = "Excellent"

        evaluation_message = (
            "The model correctly classifies most of "
            "the test samples. It has very strong "
            "classification performance."
        )

        recommendation = (
            "The model appears to perform very well. "
            "However, validate it with new data and "
            "check for possible overfitting."
        )


    elif accuracy >= 0.7:

        evaluation = "Good"

        evaluation_message = (
            "The model correctly classifies a large "
            "portion of the test samples and has "
            "good classification performance."
        )

        recommendation = (
            "The model is performing well, although "
            "testing it with additional data and "
            "examining precision and recall is recommended."
        )


    elif accuracy >= 0.5:

        evaluation = "Moderate"

        evaluation_message = (
            "The model provides some useful classification "
            "ability, but its predictions may still contain "
            "a significant number of errors."
        )

        recommendation = (
            "Consider improving the features, cleaning "
            "the dataset, adjusting the model, or trying "
            "another classification algorithm."
        )


    else:

        evaluation = "Poor"

        evaluation_message = (
            "The model correctly classifies fewer than "
            "half of the test samples. Its predictions "
            "may not be reliable."
        )

        recommendation = (
            "Review the selected features and target, "
            "clean the dataset, check class balance, "
            "and consider another classification model."
        )


    # -------------------------
    # METRIC EXPLANATIONS
    # -------------------------

    accuracy_message = (
        "Accuracy measures the percentage of test samples "
        "that were classified correctly."
    )


    precision_message = (
        "Precision measures how many samples predicted "
        "as positive were actually positive."
    )


    recall_message = (
        "Recall measures how many of the actual positive "
        "samples were correctly identified."
    )


    f1_message = (
        "F1 Score combines precision and recall into a "
        "single metric. Higher values generally indicate "
        "better classification performance."
    )


    roc_auc_message = (
        "ROC-AUC measures how well the model separates "
        "the two classes across different classification "
        "thresholds. Values closer to 1 generally indicate "
        "better separation."
    )


    log_loss_message = (
        "Log Loss measures the quality of the predicted "
        "probabilities. Lower values generally indicate "
        "better calibrated predictions."
    )


    confusion_matrix_message = (
        "The confusion matrix shows true negatives, "
        "false positives, false negatives, and true positives."
    )


    # -------------------------
    # RETURN RESULTS
    # -------------------------

    return {

        # -------------------------
        # STATUS & INFO
        # -------------------------

        "success": True,

        "model": "Logistic Regression",

        "model_type": "logistic_regression",

        # IMPORTANT:
        # This is the actual trained sklearn model
        "model_object": model,
        # -------------------------
        # DYNAMIC METRICS FOR UI
        # -------------------------

        "metrics": {
            "Accuracy": float(accuracy),
            "Precision": float(precision),
            "Recall": float(recall),
            "F1 Score": float(f1),
            "ROC-AUC": float(roc_auc),
            "Log Loss": float(loss)
        },


        # -------------------------
        # PERFORMANCE & EVALUATION
        # -------------------------

        "evaluation":
            evaluation,

        "evaluation_message":
            evaluation_message,

        "recommendation":
            recommendation,


        # -------------------------
        # INDIVIDUAL METRICS (Backward Compatibility)
        # -------------------------

        "accuracy":
            float(accuracy),

        "accuracy_message":
            accuracy_message,


        "precision":
            float(precision),

        "precision_message":
            precision_message,


        "recall":
            float(recall),

        "recall_message":
            recall_message,


        "f1_score":
            float(f1),

        "f1_message":
            f1_message,


        "roc_auc":
            float(roc_auc),

        "roc_auc_message":
            roc_auc_message,


        "log_loss":
            float(loss),

        "log_loss_message":
            log_loss_message,


        # -------------------------
        # CONFUSION MATRIX
        # -------------------------

        "confusion_matrix":
            cm.tolist(),

        "confusion_matrix_message":
            confusion_matrix_message,


        "true_negative":
            true_negative,

        "false_positive":
            false_positive,

        "false_negative":
            false_negative,

        "true_positive":
            true_positive,


        # -------------------------
        # MODEL PARAMETERS
        # -------------------------

        "intercept":
            intercept.tolist(),

        "coefficients":
            coefficients.tolist(),


        # -------------------------
        # TARGET INFORMATION
        # -------------------------

        "classes":
            model.classes_.tolist(),

        "target_mapping":
            target_mapping,


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
            predictions.tolist(),


        # -------------------------
        # PROBABILITIES
        # -------------------------

        "probabilities":
            probabilities.tolist(),

        "positive_probabilities":
            positive_probabilities.tolist()

    }
