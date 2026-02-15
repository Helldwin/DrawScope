import os
import json
import pandas as pd
from frenchlottery import get_loto_results
from stats import calculate_gaps, predict_numbers, co_occurrence_matrix

BASE_PATH = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_PATH, "..", "frontend", "public")

def convert_results(raw: pd.DataFrame):
    """
    Convertit le DataFrame frenchlottery en liste de tirages [[B1,B2,B3,B4,B5], ...]
    """
    draws = []
    for _, row in raw.iterrows():
        draw = [int(row[f"B{i}"]) for i in range(1, 6)] + [int(row["S1"])]
        draws.append(draw)
    return draws

def save_json(name, data):
    path = os.path.join(DATA_PATH, name)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def main():
    print("🔎 Récupération historique Loto...")

    # récupère le DataFrame complet
    raw: pd.DataFrame = get_loto_results()
    draws = convert_results(raw)
    print(f"✅ {len(draws)} tirages récupérés")

    # Calcul statistiques
    gap_stats = calculate_gaps(draws)
    predictions = predict_numbers(gap_stats)
    co_matrix = co_occurrence_matrix(draws)

    # Sauvegarde dans frontend/public
    save_json("data.json", draws)
    save_json("gap_stats.json", gap_stats)
    save_json("predictions.json", predictions)
    save_json("co_matrix.json", co_matrix)

    print("📊 Stats calculées")
    print("🔮 Prédictions :", predictions)
    print("💾 Fichiers mis à jour")
    print("🎉 Terminé")

if __name__ == "__main__":
    main()
