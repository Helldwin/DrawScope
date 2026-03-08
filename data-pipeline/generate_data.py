import json
import random
from datetime import datetime

# ---------------------------
# CONFIG
# ---------------------------

NUMBERS_RANGE = range(1, 50)
DRAW_SIZE = 5

# ---------------------------
# SIMULATION SCORES
# ---------------------------

def normalize(values):
    min_v = min(values)
    max_v = max(values)
    return [(v - min_v) / (max_v - min_v + 1e-9) for v in values]

# Fake frequency (simulation)
frequencies = [random.randint(10, 200) for _ in NUMBERS_RANGE]
frequency_scores = normalize(frequencies)

# Fake ecart (retard)
ecarts = [random.randint(0, 30) for _ in NUMBERS_RANGE]
ecart_scores = normalize(ecarts)

# Fake Monte Carlo
montecarlo_raw = [random.random() for _ in NUMBERS_RANGE]
montecarlo_scores = normalize(montecarlo_raw)

# ---------------------------
# SCORE FINAL (pondéré)
# ---------------------------

final_scores = {}

for i, num in enumerate(NUMBERS_RANGE):
    score = (
        0.4 * frequency_scores[i] +
        0.3 * ecart_scores[i] +
        0.3 * montecarlo_scores[i]
    )
    final_scores[str(num)] = round(score, 4)

# ---------------------------
# PREDICTION = top 5
# ---------------------------

sorted_numbers = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
predictions = sorted([int(n[0]) for n in sorted_numbers[:DRAW_SIZE]])

# ---------------------------
# FAKE RECENT DRAWS
# ---------------------------

recent_draws = []

for _ in range(5):
    draw = sorted(random.sample(NUMBERS_RANGE, DRAW_SIZE))
    recent_draws.append({
        "date": datetime.now().strftime("%Y-%m-%d"),
        "numbers": draw
    })

# ---------------------------
# OUTPUT
# ---------------------------

data = {
    "last_update": datetime.now().strftime("%Y-%m-%d"),
    "scores": final_scores,
    "predictions": predictions,
    "recent_draws": recent_draws
}

output_path = "../frontend/public/data/data.json"

with open(output_path, "w") as f:
    json.dump(data, f, indent=2)

print("Data generated successfully.")
