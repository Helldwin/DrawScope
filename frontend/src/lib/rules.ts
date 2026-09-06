export type ParityRule = "any" | "balanced" | "mostlyEven" | "mostlyOdd"

export interface RuleConfig {
	parity: ParityRule
	avoidConsecutive: boolean
	sumRange: [number, number] | null
	includeNumbers: number[]
	preferNumbers: number[]
	preferMinCount: number | null
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
	preferMinCount: null,
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

	if (config.preferMinCount !== null && config.preferMinCount > 0) {
		const preferredInGrid = numbers.filter(n => config.preferNumbers.includes(n)).length
		if (preferredInGrid < config.preferMinCount) return false
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

function* combinationsOf(pool: number[], k: number): Generator<number[]> {
	const n = pool.length
	if (k === 0) {
		yield []
		return
	}
	if (k > n) return
	const indices = Array.from({ length: k }, (_, i) => i)
	while (true) {
		yield indices.map(i => pool[i])
		let i = k - 1
		while (i >= 0 && indices[i] === n - k + i) i--
		if (i < 0) return
		indices[i]++
		for (let j = i + 1; j < k; j++) indices[j] = indices[j - 1] + 1
	}
}

export interface RankedGrid {
	combination: number[]
	scoreSum: number
}

export interface DeterministicGridsResult {
	grids: RankedGrid[]
	totalValid: number
}

function overlapCount(a: number[], b: number[]): number {
	let count = 0
	for (const n of a) if (b.includes(n)) count++
	return count
}

/**
 * Greedily picks `keepCount` grids out of `candidates` (already sorted best-first), favoring
 * coverage of the number pool over raw score: a candidate is skipped while it shares too many
 * numbers with an already-picked grid, with the "too many" threshold relaxed a step at a time
 * until enough grids are found. This is what keeps the displayed set from being five near-identical
 * permutations of the same handful of top-scoring numbers.
 */
function selectDiverse(candidates: RankedGrid[], keepCount: number, gridSize: number): RankedGrid[] {
	const selected: RankedGrid[] = []
	const consumed = new Array<boolean>(candidates.length).fill(false)

	for (let maxOverlap = 0; selected.length < keepCount && maxOverlap < gridSize; maxOverlap++) {
		for (let i = 0; i < candidates.length && selected.length < keepCount; i++) {
			if (consumed[i]) continue
			const candidate = candidates[i]
			const tooSimilar = selected.some(s => overlapCount(s.combination, candidate.combination) > maxOverlap)
			if (!tooSimilar) {
				selected.push(candidate)
				consumed[i] = true
			}
		}
	}

	for (let i = 0; i < candidates.length && selected.length < keepCount; i++) {
		if (!consumed[i]) selected.push(candidates[i])
	}

	return selected
}

/**
 * Deterministic counterpart to `generateGrid`: exhaustively enumerates every grid satisfying
 * `config` from the eligible pool (instead of weighted-random sampling), ranked by summed score,
 * then re-ranked for diversity so the kept set spreads across the number pool instead of clustering
 * around minor permutations of the same top numbers. Same inputs always produce the same result.
 * `keepCount` bounds how many are kept in memory — the eligible space can reach the full 49-choose-5
 * (~1.9M) when no constraint narrows it.
 */
export function generateAllValidGrids(
	scores: Record<number, number>,
	config: RuleConfig,
	poolSize = 49,
	count = 5,
	keepCount = 200
): DeterministicGridsResult {
	const include = [...new Set(config.includeNumbers)].filter(n => n >= 1 && n <= poolSize)
	if (include.length > count) return { grids: [], totalValid: 0 }

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
	if (eligiblePool.length < remaining) return { grids: [], totalValid: 0 }

	const includeScore = include.reduce((a, n) => a + (boostedScores[n] ?? 0), 0)

	// Keep a wider reservoir than `keepCount` so the diversity pass has real options to pick from,
	// rather than just the top `keepCount` by score (which tend to be near-duplicates of each other).
	const reservoirSize = Math.max(keepCount * 15, 3000)

	let totalValid = 0
	const reservoir: RankedGrid[] = []

	for (const rest of combinationsOf(eligiblePool, remaining)) {
		const candidate = [...include, ...rest].sort((a, b) => a - b)
		if (!satisfiesRules(candidate, config)) continue
		totalValid++
		const scoreSum = includeScore + rest.reduce((a, n) => a + (boostedScores[n] ?? 0), 0)
		if (reservoir.length < reservoirSize) {
			reservoir.push({ combination: candidate, scoreSum })
			if (reservoir.length === reservoirSize) reservoir.sort((a, b) => a.scoreSum - b.scoreSum)
		} else if (scoreSum > reservoir[0].scoreSum) {
			reservoir[0] = { combination: candidate, scoreSum }
			reservoir.sort((a, b) => a.scoreSum - b.scoreSum)
		}
	}

	reservoir.sort((a, b) => b.scoreSum - a.scoreSum)
	const grids = reservoir.length <= keepCount ? reservoir : selectDiverse(reservoir, keepCount, count)

	return { grids, totalValid }
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
