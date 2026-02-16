from sklearn.ensemble import RandomForestClassifier
import numpy as np

def train_ml(draws, features):
    X = []
    y = []

    for i in range(len(draws) - 1):
        draw = draws[i]
        next_draw = draws[i + 1]

        for n in range(1, 50):
            f = features[n]
            X.append([
                f["avg_gap"],
                f["recent_freq"],
                f["last_seen"]
            ])
            y.append(1 if n in next_draw else 0)

    model = RandomForestClassifier(n_estimators=100)
    model.fit(X, y)

    predictions = {}

    for n in range(1, 50):
        f = features[n]
        prob = model.predict_proba([[
            f["avg_gap"],
            f["recent_freq"],
            f["last_seen"]
        ]])[0][1]

        predictions[n] = round(prob * 100, 2)

    return predictions
