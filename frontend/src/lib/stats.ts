import type { Draw } from "../types"

export const POOL_SIZE = 49
export const CHANCE_POOL_SIZE = 10
export const MONTE_CARLO_ITERATIONS = 20000

export interface Weights {
	frequency: number
	ecart: number
	montecarlo: number
}

export const DEFAULT_WEIGHTS: Weights = { frequency: 0.4, ecart: 0.3, montecarlo: 0.3 }

export type Period = "30d" | "1y" | "5y" | "all"

export const PERIODS: { id: Period; label: string }[] = [
	{ id: "30d", label: "30 jours" },
	{ id: "1y", label: "1 an" },
	{ id: "5y", label: "5 ans" },
	{ id: "all", label: "Tout" }
]

export const mainPick = (d: Draw) => d.numbers
export const chancePick = (d: Draw) => [d.chance]
export type NumberKind = "main" | "chance"

export function sortByDate(draws: Draw[]): Draw[] {
	return [...draws].sort((a, b) => a.date.localeCompare(b.date))
}

export function filterByPeriod(draws: Draw[], period: Period): Draw[] {
	if (period === "all" || draws.length === 0) return draws
	const days = period === "30d" ? 30 : period === "1y" ? 365 : 365 * 5
	const sorted = sortByDate(draws)
	const last = sorted[sorted.length - 1].date
	const cutoff = new Date(last)
	cutoff.setDate(cutoff.getDate() - days)
	const cutoffStr = cutoff.toISOString().slice(0, 10)
	return sorted.filter(d => d.date >= cutoffStr)
}

function normalize(counts: Record<number, number>): Record<number, number> {
	const values = Object.values(counts)
	const min = Math.min(...values)
	const max = Math.max(...values)
	const range = max - min || 1
	const out: Record<number, number> = {}
	for (const key of Object.keys(counts)) {
		out[Number(key)] = (counts[Number(key)] - min) / range
	}
	return out
}

export function computeFrequency(
	draws: Draw[],
	poolSize = POOL_SIZE,
	pick: (d: Draw) => number[] = mainPick
): Record<number, number> {
	const counts: Record<number, number> = {}
	for (let i = 1; i <= poolSize; i++) counts[i] = 0
	for (const draw of draws) for (const n of pick(draw)) counts[n]++
	return counts
}

function daysBetween(a: string, b: string): number {
	return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

/** Days elapsed since each number's last appearance, relative to the most recent draw in `draws`. */
export function computeEcartDays(
	draws: Draw[],
	poolSize = POOL_SIZE,
	pick: (d: Draw) => number[] = mainPick
): Record<number, number> {
	const sorted = sortByDate(draws)
	const referenceDate = sorted[sorted.length - 1]?.date
	const lastSeen: Record<number, string | null> = {}
	for (let i = 1; i <= poolSize; i++) lastSeen[i] = null
	for (const draw of sorted) for (const n of pick(draw)) lastSeen[n] = draw.date

	const out: Record<number, number> = {}
	for (let i = 1; i <= poolSize; i++) {
		out[i] = lastSeen[i] && referenceDate ? daysBetween(lastSeen[i]!, referenceDate) : 9999
	}
	return out
}

export function computeMonteCarlo(
	draws: Draw[],
	poolSize = POOL_SIZE,
	pickCount = 5,
	pick: (d: Draw) => number[] = mainPick,
	iterations = MONTE_CARLO_ITERATIONS
): Record<number, number> {
	const pool = draws.flatMap(pick)
	const counts: Record<number, number> = {}
	for (let i = 1; i <= poolSize; i++) counts[i] = 0

	const n = pool.length
	if (n < pickCount) return counts

	// Persistent partial Fisher-Yates: reusing the same index array across
	// iterations is still statistically valid (it always holds a permutation).
	const indices = Array.from({ length: n }, (_, i) => i)
	for (let iter = 0; iter < iterations; iter++) {
		for (let i = 0; i < pickCount; i++) {
			const j = i + Math.floor(Math.random() * (n - i))
			const tmp = indices[i]
			indices[i] = indices[j]
			indices[j] = tmp
			counts[pool[indices[i]]]++
		}
	}
	return counts
}

export function computeCompositeScores(
	draws: Draw[],
	weights: Weights = DEFAULT_WEIGHTS,
	poolSize = POOL_SIZE,
	pickCount = 5,
	pick: (d: Draw) => number[] = mainPick,
	monteCarloIterations = MONTE_CARLO_ITERATIONS
): Record<number, number> {
	const freq = normalize(computeFrequency(draws, poolSize, pick))
	const ecart = normalize(computeEcartDays(draws, poolSize, pick))
	const monte = normalize(computeMonteCarlo(draws, poolSize, pickCount, pick, monteCarloIterations))

	const weightSum = weights.frequency + weights.ecart + weights.montecarlo || 1
	const wf = weights.frequency / weightSum
	const we = weights.ecart / weightSum
	const wm = weights.montecarlo / weightSum

	const out: Record<number, number> = {}
	for (let i = 1; i <= poolSize; i++) {
		out[i] = wf * freq[i] + we * ecart[i] + wm * monte[i]
	}
	return out
}

export function topPredictions(scores: Record<number, number>, count = 5): number[] {
	return Object.entries(scores)
		.sort((a, b) => b[1] - a[1])
		.slice(0, count)
		.map(([n]) => Number(n))
		.sort((a, b) => a - b)
}

export function computeChanceScores(draws: Draw[], weights: Weights = DEFAULT_WEIGHTS): Record<number, number> {
	return computeCompositeScores(draws, weights, CHANCE_POOL_SIZE, 1, chancePick, 4000)
}

export function computeFrequencyScores(draws: Draw[], poolSize = POOL_SIZE, pick: (d: Draw) => number[] = mainPick): Record<number, number> {
	return normalize(computeFrequency(draws, poolSize, pick))
}

export function computeEcartScores(draws: Draw[], poolSize = POOL_SIZE, pick: (d: Draw) => number[] = mainPick): Record<number, number> {
	return normalize(computeEcartDays(draws, poolSize, pick))
}

export interface GridEvaluation {
	bestMatches: number
	bestMatchDate: string | null
	exactMatches: number
}

/** Compares a manually entered combination against the full draw history. */
export function evaluateGridAgainstHistory(draws: Draw[], numbers: number[]): GridEvaluation {
	const target = new Set(numbers)
	let bestMatches = 0
	let bestMatchDate: string | null = null
	let exactMatches = 0

	for (const d of draws) {
		const overlap = d.numbers.filter(n => target.has(n)).length
		if (overlap > bestMatches) {
			bestMatches = overlap
			bestMatchDate = d.date
		}
		if (overlap === numbers.length && d.numbers.length === numbers.length) exactMatches++
	}

	return { bestMatches, bestMatchDate, exactMatches }
}

// -----------------------
// Advanced statistics
// -----------------------

export interface ParityStats {
	even: number
	odd: number
	total: number
}

export function computeParity(draws: Draw[]): ParityStats {
	let even = 0
	let odd = 0
	for (const d of draws) for (const n of d.numbers) (n % 2 === 0 ? even++ : odd++)
	return { even, odd, total: even + odd }
}

export interface HighLowStats {
	low: number
	high: number
	total: number
}

export function computeHighLow(draws: Draw[], threshold = 25): HighLowStats {
	let low = 0
	let high = 0
	for (const d of draws) for (const n of d.numbers) (n <= threshold ? low++ : high++)
	return { low, high, total: low + high }
}

export function computeSumDistribution(draws: Draw[]): number[] {
	return draws.map(d => d.numbers.reduce((a, b) => a + b, 0))
}

export interface ConsecutiveStats {
	withConsecutive: number
	total: number
	ratio: number
}

export function computeConsecutiveStats(draws: Draw[]): ConsecutiveStats {
	let withConsecutive = 0
	for (const d of draws) {
		const sorted = [...d.numbers].sort((a, b) => a - b)
		for (let i = 1; i < sorted.length; i++) {
			if (sorted[i] === sorted[i - 1] + 1) {
				withConsecutive++
				break
			}
		}
	}
	return { withConsecutive, total: draws.length, ratio: draws.length ? withConsecutive / draws.length : 0 }
}

export interface PairStat {
	a: number
	b: number
	count: number
}

export function computeTopPairs(draws: Draw[], topN = 10): PairStat[] {
	const counts = new Map<string, number>()
	for (const d of draws) {
		const sorted = [...d.numbers].sort((a, b) => a - b)
		for (let i = 0; i < sorted.length; i++) {
			for (let j = i + 1; j < sorted.length; j++) {
				const key = `${sorted[i]}-${sorted[j]}`
				counts.set(key, (counts.get(key) ?? 0) + 1)
			}
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, topN)
		.map(([key, count]) => {
			const [a, b] = key.split("-").map(Number)
			return { a, b, count }
		})
}

export interface NumberProfile {
	number: number
	frequency: number
	ecartDays: number
	score: number
	appearances: string[]
}

export function computeNumberProfile(
	draws: Draw[],
	number: number,
	scores: Record<number, number>,
	pick: (d: Draw) => number[] = mainPick
): NumberProfile {
	const sorted = sortByDate(draws)
	const appearances = sorted.filter(d => pick(d).includes(number)).map(d => d.date)
	const ecart = computeEcartDays(draws, POOL_SIZE, pick)
	return {
		number,
		frequency: appearances.length,
		ecartDays: ecart[number] ?? 9999,
		score: scores[number] ?? 0,
		appearances: appearances.slice(-10).reverse()
	}
}
