import json
from monte_carlo import monte_carlo_simulation
from feature_engineering import compute_features
from ml_model import train_ml
from hybrid_predictor import hybrid_score

def main(draws):

    print("🔬 Monte Carlo simulation...")
    mc = monte_carlo_simulation(draws)

    print("🧠 Feature engineering...")
    features = compute_features(draws)

    print("🤖 Training ML...")
    ml = train_ml(draws, features)

    print("🎯 Hybrid scoring...")
    final = hybrid_score(mc, ml)

    with open("../frontend/public/scores.json", "w") as f:
        json.dump(final, f, indent=2)

    print("✅ Scores générés !")

if __name__ == "__main__":
    with open("../frontend/public/data.json") as f:
        draws = json.load(f)

    main(draws)
