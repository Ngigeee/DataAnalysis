import pandas as pd

from sklearn.model_selection import train_test_split

from sklearn.tree import (
    DecisionTreeClassifier,
    DecisionTreeRegressor
)

from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    r2_score,
    mean_squared_error,
    mean_absolute_error
)


def decisionTree(
    df,
    features,
    target,
    test_size=0.2,
    random_state=42
):

    # =====================================================
    # GET FEATURES AND TARGET
    # =====================================================

    model_data = df[
        features + [target]
    ].dropna()


    if len(model_data) < 5:

        return {
            "success": False,
            "error": (
                "Not enough valid rows to train "
                "the Decision Tree."
            )
        }


    X = model_data[features]

    y = model_data[target]


    # =====================================================
    # CHECK FEATURES
    # =====================================================

    non_numeric_features = [

        column

        for column in features

        if not pd.api.types.is_numeric_dtype(
            X[column]
        )

    ]


    if non_numeric_features:

        return {
            "success": False,
            "error": (
                "Decision Tree currently requires "
                "numeric features. Non-numeric features: "
                + ", ".join(non_numeric_features)
            )
        }


    # =====================================================
    # DETECT TARGET TYPE
    # =====================================================

    unique_values = y.nunique()

    target_dtype = y.dtype


    # -----------------------------------------------------
    # TEXT / CATEGORY / BOOLEAN
    # -----------------------------------------------------

    if (
        pd.api.types.is_object_dtype(target_dtype)
        or
        pd.api.types.is_string_dtype(target_dtype)
        or
        pd.api.types.is_categorical_dtype(target_dtype)
        or
        pd.api.types.is_bool_dtype(target_dtype)
    ):

        problem_type = "classification"


    # -----------------------------------------------------
    # NUMERIC
    # -----------------------------------------------------

    elif pd.api.types.is_numeric_dtype(target_dtype):

        # Small number of unique values
        # is treated as discrete

        if unique_values <= 10:

            problem_type = "classification"

        else:

            problem_type = "regression"


    # -----------------------------------------------------
    # UNKNOWN
    # -----------------------------------------------------

    else:

        return {
            "success": False,
            "error": "Unable to determine target type."
        }


    # =====================================================
    # SPLIT DATA
    # =====================================================

    X_train, X_test, y_train, y_test = train_test_split(

        X,
        y,

        test_size=test_size,

        random_state=random_state

    )


    # =====================================================
    # CLASSIFICATION
    # =====================================================

    if problem_type == "classification":


        # -------------------------------------------------
        # CREATE MODEL
        # -------------------------------------------------

        model = DecisionTreeClassifier(

            random_state=random_state

        )


        # -------------------------------------------------
        # TRAIN
        # -------------------------------------------------

        model.fit(

            X_train,

            y_train

        )


        # -------------------------------------------------
        # PREDICTIONS
        # -------------------------------------------------

        predictions = model.predict(

            X_test

        )


        # -------------------------------------------------
        # METRICS
        # -------------------------------------------------

        accuracy = accuracy_score(

            y_test,

            predictions

        )


        precision = precision_score(

            y_test,

            predictions,

            average="weighted",

            zero_division=0

        )


        recall = recall_score(

            y_test,

            predictions,

            average="weighted",

            zero_division=0

        )


        f1 = f1_score(

            y_test,

            predictions,

            average="weighted",

            zero_division=0

        )


        matrix = confusion_matrix(

            y_test,

            predictions

        )


        # -------------------------------------------------
        # EVALUATION
        # -------------------------------------------------

        if accuracy >= 0.9:

            evaluation = "Excellent"

            evaluation_message = (
                "The model correctly classifies most "
                "of the test data. The Decision Tree "
                "has very strong predictive performance."
            )

            recommendation = (
                "The model appears to perform very well. "
                "Validate it with new data before relying "
                "on its predictions."
            )


        elif accuracy >= 0.7:

            evaluation = "Good"

            evaluation_message = (
                "The model correctly classifies a large "
                "portion of the test data. The Decision Tree "
                "has good predictive performance."
            )

            recommendation = (
                "The model is performing well, although "
                "testing it with new data is recommended."
            )


        elif accuracy >= 0.5:

            evaluation = "Moderate"

            evaluation_message = (
                "The model correctly classifies some "
                "of the test data, but there is room "
                "for improvement."
            )

            recommendation = (
                "Consider improving the selected features, "
                "cleaning the dataset, or adjusting the "
                "Decision Tree."
            )


        else:

            evaluation = "Poor"

            evaluation_message = (
                "The model correctly classifies less "
                "than half of the test data."
            )

            recommendation = (
                "Try different features, clean the dataset, "
                "or use another machine learning model."
            )


        # -------------------------------------------------
        # RETURN CLASSIFICATION
        # -------------------------------------------------

        return {

            "success": True,

            "model": "Decision Tree",

            "model_type":
                "decision_tree",

            "problem_type":
                "classification",


            # ---------------------------------------------
            # DYNAMIC METRICS
            # ---------------------------------------------

            "metrics": {

                "Accuracy":
                    float(accuracy),

                "Precision":
                    float(precision),

                "Recall":
                    float(recall),

                "F1 Score":
                    float(f1)

            },


            # ---------------------------------------------
            # EVALUATION
            # ---------------------------------------------

            "evaluation":
                evaluation,

            "evaluation_message":
                evaluation_message,

            "recommendation":
                recommendation,


            # ---------------------------------------------
            # INDIVIDUAL METRICS
            # ---------------------------------------------

            "accuracy":
                float(accuracy),

            "precision":
                float(precision),

            "recall":
                float(recall),

            "f1_score":
                float(f1),


            # ---------------------------------------------
            # TREE INFORMATION
            # ---------------------------------------------

            "tree_depth":
                int(model.get_depth()),

            "number_of_leaves":
                int(model.get_n_leaves()),


            # ---------------------------------------------
            # CLASSES
            # ---------------------------------------------

            "classes":
                model.classes_.tolist(),


            # ---------------------------------------------
            # CONFUSION MATRIX
            # ---------------------------------------------

            "confusion_matrix":
                matrix.astype(int).tolist(),


            # ---------------------------------------------
            # DATASET INFORMATION
            # ---------------------------------------------

            "features":
                features,

            "target":
                target,

            "training_rows":
                int(len(X_train)),

            "testing_rows":
                int(len(X_test)),


            # ---------------------------------------------
            # PREDICTIONS
            # ---------------------------------------------

            "predictions":
                predictions.tolist()

        }


    # =====================================================
    # REGRESSION
    # =====================================================

    else:


        # -------------------------------------------------
        # CREATE MODEL
        # -------------------------------------------------

        model = DecisionTreeRegressor(

            random_state=random_state

        )


        # -------------------------------------------------
        # TRAIN
        # -------------------------------------------------

        model.fit(

            X_train,

            y_train

        )


        # -------------------------------------------------
        # PREDICTIONS
        # -------------------------------------------------

        predictions = model.predict(

            X_test

        )


        # -------------------------------------------------
        # METRICS
        # -------------------------------------------------

        r2 = r2_score(

            y_test,

            predictions

        )


        mse = mean_squared_error(

            y_test,

            predictions

        )


        mae = mean_absolute_error(

            y_test,

            predictions

        )


        # -------------------------------------------------
        # EVALUATION
        # -------------------------------------------------

        if r2 >= 0.9:

            evaluation = "Excellent"

            evaluation_message = (
                "The model explains most of the variation "
                "in the target and has a very strong "
                "predictive fit."
            )

            recommendation = (
                "The model appears to perform very well. "
                "Validate it with new data before relying "
                "on its predictions."
            )


        elif r2 >= 0.7:

            evaluation = "Good"

            evaluation_message = (
                "The model explains a large portion of "
                "the variation in the target and has "
                "a good predictive fit."
            )

            recommendation = (
                "The model is performing well, although "
                "testing it with new data is recommended."
            )


        elif r2 >= 0.5:

            evaluation = "Moderate"

            evaluation_message = (
                "The model explains some of the variation "
                "in the target, but other factors may "
                "also be important."
            )

            recommendation = (
                "Consider improving the selected features, "
                "cleaning the dataset, or adjusting the "
                "Decision Tree."
            )


        elif r2 >= 0:

            evaluation = "Poor"

            evaluation_message = (
                "The model explains very little of the "
                "variation in the target."
            )

            recommendation = (
                "Try adding more relevant features, "
                "cleaning the data, or using another model."
            )


        else:

            evaluation = "Very Poor"

            evaluation_message = (
                "The model performs worse than a simple "
                "baseline that predicts the average "
                "target value."
            )

            recommendation = (
                "Try different features, clean the data, "
                "or choose another machine learning model."
            )


        # -------------------------------------------------
        # RETURN REGRESSION
        # -------------------------------------------------

        return {

            "success": True,

            "model": "Decision Tree",

            "model_type":
                "decision_tree",

            "problem_type":
                "regression",


            # ---------------------------------------------
            # DYNAMIC METRICS
            # ---------------------------------------------

            "metrics": {

                "R² Score":
                    float(r2),

                "Mean Squared Error":
                    float(mse),

                "Mean Absolute Error":
                    float(mae)

            },


            # ---------------------------------------------
            # EVALUATION
            # ---------------------------------------------

            "evaluation":
                evaluation,

            "evaluation_message":
                evaluation_message,

            "recommendation":
                recommendation,


            # ---------------------------------------------
            # INDIVIDUAL METRICS
            # ---------------------------------------------

            "r2_score":
                float(r2),

            "mse":
                float(mse),

            "mae":
                float(mae),


            # ---------------------------------------------
            # TREE INFORMATION
            # ---------------------------------------------

            "tree_depth":
                int(model.get_depth()),

            "number_of_leaves":
                int(model.get_n_leaves()),


            # ---------------------------------------------
            # DATASET INFORMATION
            # ---------------------------------------------

            "features":
                features,

            "target":
                target,

            "training_rows":
                int(len(X_train)),

            "testing_rows":
                int(len(X_test)),


            # ---------------------------------------------
            # PREDICTIONS
            # ---------------------------------------------

            "predictions":
                predictions.tolist()

        }
