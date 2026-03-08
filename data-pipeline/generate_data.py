import json
import random

score = (
    0.4 * frequency_score +
    0.3 * ecart_score +
    0.3 * montecarlo_score
)


predictions = sorted(random.sample(range(1, 50), 5))

data = {
    "scores": scores,
    "predictions": predictions
}

with open("../frontend/public/data/data.json", "w") as f:
    json.dump(data, f)

print("Data generated")
