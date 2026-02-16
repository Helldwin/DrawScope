import numpy as np

def compute_features(draws):
    features = {}

    for n in range(1, 50):
        positions = [i for i, d in enumerate(draws) if n in d]

        if not positions:
            continue

        gaps = np.diff(positions)
        avg_gap = np.mean(gaps) if len(gaps) else 0

        recent_freq = sum(n in d for d in draws[-100:])

        features[n] = {
            "avg_gap": avg_gap,
            "recent_freq": recent_freq,
            "last_seen": len(draws) - positions[-1]
        }

    return features
