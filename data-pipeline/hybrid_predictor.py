def hybrid_score(mc, ml):
    final = {}

    for n in range(1, 50):
        final[n] = round((mc[n] * 0.4 + ml[n] * 0.6), 2)

    return final
