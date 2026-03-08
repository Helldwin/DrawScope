import json
import random

scores = {i: random.randint(10, 100) for i in range(1, 50)}

predictions = sorted(random.sample(range(1, 50), 5))

data = {
    "scores": scores,
    "predictions": predictions
}

with open("../frontend/public/data/data.json", "w") as f:
    json.dump(data, f)

print("Data generated")
