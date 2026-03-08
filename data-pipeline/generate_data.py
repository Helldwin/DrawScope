import json
import numpy as np
import pandas as pd
from datetime import datetime
from frenchlottery import loto

# -----------------------
# FETCH REAL LOTO DATA
# -----------------------

print("Fetching Loto history...")

df = loto.get_loto_draws()

# Colonnes : B1 B2 B3 B4 B5 S1
numbers_columns = ["B1", "B2", "B3", "B4", "B5"]

all_numbers = df[numbers_columns].values.flatten()

# -----------------------
# FREQUENCY
# -----------------------

freq = pd.Series(all_numbers).value_counts().sort_index()

# Assurer 1→49 complet
for i in range(1, 50):
    if i not in freq:
        freq[i] = 0

freq = freq.sort_index()

frequency_scores = (freq - freq.min()) / (freq.max() - freq.min())

# -----------------------
# ECART (retard)
# -----------------------

last_seen = {}

for num in range(1, 50):
    draws = df[df[numbers_columns].isin([num]).any(axis=1)]
    if len(draws) > 0:
        last_date = draws.index.max()
        last_seen[num] = (df.index.max() - last_date).days
    else:
        last_seen[num] = 999

ecarts_series = pd.Series(last_seen)
ecart_scores = (ecarts_series - ecarts_series.min()) / (
    ecarts_series.max() - ecarts_series.min()
)

# -----------------------
# MONTE CARLO
# -----------------------

sim_counts = {i: 0 for i in range(1, 50)}

for _ in range(20000):
    draw = np.random.choice(all_numbers, 5, replace=False)
    for n in draw:
        sim_counts[n] += 1

monte_series = pd.Series(sim_counts)
monte_scores = (monte_series - monte_series.min()) / (
    monte_series.max() - monte_series.min()
)

# -----------------------
# FINAL SCORE
# -----------------------

final_scores = {}

for num in range(1, 50):
    score = (
        0.4 * frequency_scores[num] +
        0.3 * ecart_scores[num] +
        0.3 * monte_scores[num]
    )
    final_scores[str(num)] = round(float(score), 4)

# -----------------------
# PREDICTIONS
# -----------------------

sorted_numbers = sorted(final_scores.items(), key=lambda x: x[1], reverse=True)
predictions = sorted([int(n[0]) for n in sorted_numbers[:5]])

# -----------------------
# RECENT DRAWS
# -----------------------

recent_draws = []

for date, row in df.tail(5).iterrows():
    recent_draws.append({
        "date": date.strftime("%Y-%m-%d"),
        "numbers": row[numbers_columns].tolist()
    })

# -----------------------
# OUTPUT
# -----------------------

data = {
    "last_update": datetime.now().strftime("%Y-%m-%d"),
    "scores": final_scores,
    "predictions": predictions,
    "recent_draws": recent_draws
}

output_path = "../frontend/public/data/data.json"

with open(output_path, "w") as f:
    json.dump(data, f, indent=2)

print("Real data generated successfully.")
