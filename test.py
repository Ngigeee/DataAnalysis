import joblib

model = joblib.load("saved_models/linear_regression_bmi_9012d099.pkl")

print(type(model))
print(model)
