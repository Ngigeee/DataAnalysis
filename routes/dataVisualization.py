from flask import Blueprint, request, jsonify
import pandas as pd

from .loadActiveDataset import get_active_dataframe


dataVisualize_bp = Blueprint(
    "dataVisualize",
    __name__
)


@dataVisualize_bp.route("/visualize", methods=["POST"])
def visualize():

    try:

        data = request.get_json()

        chart_type = data.get("type")

        df, _ = get_active_dataframe()


        # -----------------------------
        # HISTOGRAM
        # -----------------------------
        if chart_type == "histogram":

            column = data.get("column")


            if column not in df.columns:
                return jsonify({
                    "error": "Column not found"
                }), 400


            values = pd.to_numeric(
                df[column],
                errors="coerce"
            ).dropna()


            if values.empty:
                return jsonify({
                    "error": "No numeric data"
                }),400


            histogram = (
                pd.cut(
                    values,
                    bins=10
                )
                .value_counts()
                .sort_index()
            )


            return jsonify({

                "type":"histogram",

                "labels":[
                    str(x)
                    for x in histogram.index
                ],

                "data":[
                    int(x)
                    for x in histogram.values
                ],

                "column":column

            })


        # -----------------------------
        # SCATTER
        # -----------------------------
        elif chart_type == "scatter":

            x = data.get("x")
            y = data.get("y")


            if x not in df.columns or y not in df.columns:

                return jsonify({
                    "error":"Column not found"
                }),400


            temp = df[[x,y]].copy()


            temp[x] = pd.to_numeric(
                temp[x],
                errors="coerce"
            )

            temp[y] = pd.to_numeric(
                temp[y],
                errors="coerce"
            )


            temp = temp.dropna()


            points = [

                {
                    "x": float(row[x]),
                    "y": float(row[y])
                }

                for _, row in temp.iterrows()

            ]


            return jsonify({

                "type":"scatter",

                "label":f"{x} vs {y}",

                "points":points

            })



        # -----------------------------
        # BAR CHART
        # -----------------------------
        elif chart_type == "bar":

            category = data.get("category")
            value = data.get("value")


            if category not in df.columns or value not in df.columns:

                return jsonify({
                    "error":"Column not found"
                }),400



            temp = df.copy()


            temp[value] = pd.to_numeric(
                temp[value],
                errors="coerce"
            )


            result = (
                temp
                .groupby(category)[value]
                .sum()
                .dropna()
            )


            return jsonify({

                "type":"bar",

                "labels":[
                    str(x)
                    for x in result.index
                ],

                "data":[
                    float(x)
                    for x in result.values
                ],

                "label":
                f"Sum of {value} by {category}"

            })


        return jsonify({
            "error":"Invalid chart type"
        }),400



    except Exception as e:

        return jsonify({
            "error":str(e)
        }),500
