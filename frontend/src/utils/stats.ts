export type Draw = number[];

export function computeFrequencies(draws: Draw[]) {
	const freq: Record<number, number> = {};

	for (let i = 1; i <= 49; i++) {
		freq[i] = 0;
	}

	for (const draw of draws) {
		for (const number of draw) {
			freq[number]++;
		}
	}

	return freq;
}
