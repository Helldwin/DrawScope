export type ParityRule = "any" | "balanced" | "mostlyEven" | "mostlyOdd"

export interface RuleConfig {
	parity: ParityRule
	avoidConsecutive: boolean
	sumRange: [number, number] | null
}

export const DEFAULT_RULES: RuleConfig = {
	parity: "any",
	avoidConsecutive: false,
	sumRange: null
}

function weightedSample(scores: Record<number, number>, poolSize: number, count: number): number[] {
	const pool = Array.from({ length: poolSize }, (_, i) => i + 1)
	const weights = pool.map(n => (scores[n] ?? 0) + 0.05)
	const picked: number[] = []

	for (let k = 0; k < count && pool.length > 0; k++) {
		const total = weights.reduce((a, b) => a + b, 0)
		let r = Math.random() * total
		let idx = 0
		for (; idx < pool.length; idx++) {
			r -= weights[idx]
			if (r <= 0) break
		}
		idx = Math.min(idx, pool.length - 1)
		picked.push(pool[idx])
		pool.splice(idx, 1)
		weights.splice(idx, 1)
	}
	return picked.sort((a, b) => a - b)
}

export function satisfiesRules(numbers: number[], config: RuleConfig): boolean {
	if (config.avoidConsecutive) {
		const sorted = [...numbers].sort((a, b) => a - b)
		for (let i = 1; i < sorted.length; i++) {
			if (sorted[i] === sorted[i - 1] + 1) return false
		}
	}

	if (config.parity !== "any") {
		const evenCount = numbers.filter(n => n % 2 === 0).length
		if (config.parity === "balanced" && !(evenCount === 2 || evenCount === 3)) return false
		if (config.parity === "mostlyEven" && evenCount < 3) return false
		if (config.parity === "mostlyOdd" && evenCount > 2) return false
	}

	if (config.sumRange) {
		const sum = numbers.reduce((a, b) => a + b, 0)
		if (sum < config.sumRange[0] || sum > config.sumRange[1]) return false
	}

	return true
}

/** Weighted-random search for a 5-number grid satisfying `config`, biased by `scores`. */
export function generateGrid(
	scores: Record<number, number>,
	config: RuleConfig,
	poolSize = 49,
	count = 5,
	attempts = 3000
): number[] | null {
	let best: number[] | null = null
	let bestScore = -Infinity

	for (let i = 0; i < attempts; i++) {
		const candidate = weightedSample(scores, poolSize, count)
		if (!satisfiesRules(candidate, config)) continue
		const candidateScore = candidate.reduce((a, n) => a + (scores[n] ?? 0), 0)
		if (candidateScore > bestScore) {
			bestScore = candidateScore
			best = candidate
		}
	}
	return best
}

export interface GridStrategy {
	id: string
	label: string
	description: string
	scores: Record<number, number>
	rules: RuleConfig
}

export function generateMultipleGrids(strategies: GridStrategy[]): { strategy: GridStrategy; grid: number[] | null }[] {
	return strategies.map(strategy => ({
		strategy,
		grid: generateGrid(strategy.scores, strategy.rules)
	}))
}
