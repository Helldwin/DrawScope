from collections import defaultdict
import numpy as np


def calculate_gaps(draws):
    gaps = defaultdict(list)
    last_seen = {}

    for idx, draw in enumerate(draws):
        for num in range(1, 50):
            if num not in draw:
                if num in last_seen:
                    gap = idx - last_seen[num]
                    gaps[num].append(gap)
            else:
                last_seen[num] = idx

    result = {}

    for num in range(1, 50):
        g = gaps.get(num, [])
        avg = sum(g) / len(g) if g else 0

        result[num] = {
            "avg_gap": avg,
            "max_gap": max(g) if g else 0,
            "min_gap": min(g) if g else 0,
            "count": len(g),
        }

    return result


def predict_numbers(gap_stats):
    scores = {}

    for num, stats in gap_stats.items():
        scores[num] = stats["avg_gap"] + 1

    sorted_nums = sorted(scores, key=lambda x: scores[x], reverse=True)

    return sorted_nums[:5]


def co_occurrence_matrix(draws):
    matrix = np.zeros((49, 49))

    for draw in draws:
        for i in draw:
            for j in draw:
                if i != j:
                    matrix[i - 1][j - 1] += 1

    return matrix.tolist()
