from fastapi.middleware.cors import CORSMiddleware

from fastapi import FastAPI
from pydantic import BaseModel
import json

from monte_carlo import monte_carlo_simulation
from feature_engineering import compute_features
from ml_model import train_ml

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["https://drawscope.quentin-helayel.me"]
    allow_origins=["*"],  # pour dev local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger les données une fois
with open("../frontend/public/data.json") as f:
    draws = json.load(f)

features = compute_features(draws)
mc_scores = monte_carlo_simulation(draws)
ml_scores = train_ml(draws, features)


class Weights(BaseModel):
    montecarlo: float
    ml: float
    stats: float


@app.post("/predict")
def predict(weights: Weights):

    final = {}

    for n in range(1, 50):

        stats_score = features[n]["recent_freq"]

        score = (
            mc_scores[n] * weights.montecarlo +
            ml_scores[n] * weights.ml +
            stats_score * weights.stats
        )

        final[n] = round(score, 2)

    return final
