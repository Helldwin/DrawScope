import numpy as np
from collections import Counter

def monte_carlo_simulation(draws, n_sim=100000):
    # fréquence historique
    freq = Counter()

    for draw in draws:
        for n in draw:
            freq[n] += 1

    total = sum(freq.values())
    probs = np.array([freq[i] / total for i in range(1, 50)])

    results = Counter()

    for _ in range(n_sim):
        sim = np.random.choice(range(1, 50), size=5, replace=False, p=probs)
        for n in sim:
            results[n] += 1

    scores = {
        i: round((results[i] / (n_sim * 5)) * 100, 2)
        for i in range(1, 50)
    }

    return scores
