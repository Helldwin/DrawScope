export type ParityRule = "any" | "balanced" | "mostlyEven" | "mostlyOdd"

export interface RuleConfig {
	parity: ParityRule
	avoidConsecutive: boolean
	sumRange: [number, number] | null
	includeNumbers: number[]
	preferNumbers: number[]
	excludeNumbers: number[]
	numberRange: [number, number] | null
	lowHighCount: number | null
	minScore: number | null
}

export const DEFAULT_RULES: RuleConfig = {
	parity: "any",
	avoidConsecutive: false,
	sumRange: null,
	includeNumbers: [],
	preferNumbers: [],
	excludeNumbers: [],
	numberRange: null,
	lowHighCount: null,
	minScore: null
}

/** Additive score bonus applied to "preferred" numbers so they're more likely to be picked without being forced into every grid. */
const PREFER_BOOST = 0.3

function weightedSampleFrom(pool: number[], scores: Record<number, number>, count: number): number[] {
	const candidates = [...pool]
	const weights = candidates.map(n => (scores[n] ?? 0) + 0.05)
	const picked: number[] = []

	for (let k = 0; k < count && candidates.length > 0; k++) {
		const total = weights.reduce((a, b) => a + b, 0)
		let r = Math.random() * total
		let idx = 0
		for (; idx < candidates.length; idx++) {
			r -= weights[idx]
			if (r <= 0) break
		}
		idx = Math.min(idx, candidates.length - 1)
		picked.push(candidates[idx])
		candidates.splice(idx, 1)
		weights.splice(idx, 1)
	}
	return picked
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

	if (config.lowHighCount !== null) {
		const lowCount = numbers.filter(n => n <= 25).length
		if (lowCount !== config.lowHighCount) return false
	}

	for (const n of config.includeNumbers) {
		if (!numbers.includes(n)) return false
	}

	for (const n of config.excludeNumbers) {
		if (numbers.includes(n)) return false
	}

	return true
}

/**
 * Weighted-random search for a grid satisfying `config`, biased by `scores`.
 * Forced inclusions are seeded directly; the remaining slots are drawn from
 * the eligible pool (range / exclusions / minimum score) and rejection-tested
 * against the softer constraints (parity, sum, consecutive, low/high split).
 */
export function generateGrid(
	scores: Record<number, number>,
	config: RuleConfig,
	poolSize = 49,
	count = 5,
	attempts = 3000
): number[] | null {
	const include = [...new Set(config.includeNumbers)].filter(n => n >= 1 && n <= poolSize)
	if (include.length > count) return null

	const preferSet = new Set(config.preferNumbers)
	const boostedScores: Record<number, number> = { ...scores }
	for (const n of preferSet) {
		boostedScores[n] = (scores[n] ?? 0) + PREFER_BOOST
	}

	const excludeSet = new Set(config.excludeNumbers)
	const [rangeMin, rangeMax] = config.numberRange ?? [1, poolSize]

	const eligiblePool = Array.from({ length: poolSize }, (_, i) => i + 1).filter(
		n =>
			!excludeSet.has(n) &&
			!include.includes(n) &&
			n >= rangeMin &&
			n <= rangeMax &&
			(config.minScore === null || (scores[n] ?? 0) >= config.minScore)
	)

	const remaining = count - include.length
	if (eligiblePool.length < remaining) return null

	let best: number[] | null = null
	let bestScore = -Infinity

	for (let i = 0; i < attempts; i++) {
		const rest = weightedSampleFrom(eligiblePool, boostedScores, remaining)
		if (rest.length < remaining) continue
		const candidate = [...include, ...rest].sort((a, b) => a - b)
		if (!satisfiesRules(candidate, config)) continue
		const candidateScore = candidate.reduce((a, n) => a + (boostedScores[n] ?? 0), 0)
		if (candidateScore > bestScore) {
			bestScore = candidateScore
			best = candidate
		}
	}
	return best
}

/** Generates up to `count` distinct grids satisfying the same config (best-effort — duplicates allowed if the constraints are very tight). */
export function generateDistinctGrids(
	scores: Record<number, number>,
	config: RuleConfig,
	count: number,
	poolSize = 49,
	gridSize = 5,
	attemptsPerGrid = 1500
): number[][] {
	const results: number[][] = []
	const seen = new Set<string>()
	const maxTries = count * 4

	for (let i = 0; i < maxTries && results.length < count; i++) {
		const grid = generateGrid(scores, config, poolSize, gridSize, attemptsPerGrid)
		if (!grid) break
		const key = grid.join(",")
		if (seen.has(key) && results.length < maxTries - 1) continue
		seen.add(key)
		results.push(grid)
	}
	return results
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
