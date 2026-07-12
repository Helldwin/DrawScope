import io
import json
import zipfile
import numpy as np
import pandas as pd
import requests
from datetime import datetime

# Archive officielle FDJ des tirages Loto (format en vigueur depuis nov. 2019).
LOTO_ARCHIVE_URL = "https://www.sto.api.fdj.fr/anonymous/service-draw-info/v3/documentations/1a2b3c4d-9876-4562-b3fc-2c963f66afp6"

# -----------------------
# FETCH REAL LOTO DATA
# -----------------------

print("Fetching Loto history...")

response = requests.get(LOTO_ARCHIVE_URL, timeout=30)
response.raise_for_status()

with zipfile.ZipFile(io.BytesIO(response.content)) as archive:
    csv_name = archive.namelist()[0]
    with archive.open(csv_name) as csv_file:
        df = pd.read_csv(csv_file, sep=";", decimal=",")

df["date_de_tirage"] = pd.to_datetime(df["date_de_tirage"], format="%d/%m/%Y")
df = df.sort_values("date_de_tirage").set_index("date_de_tirage")

# Colonnes : boule_1..boule_5, numero_chance
numbers_columns = ["boule_1", "boule_2", "boule_3", "boule_4", "boule_5"]

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
        "numbers": row[numbers_columns].tolist(),
        "chance": int(row["numero_chance"])
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
