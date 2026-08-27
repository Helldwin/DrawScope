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

export interface DecadeBucket {
	label: string
	count: number
}

const DECADE_RANGES: [number, number][] = [[1, 9], [10, 19], [20, 29], [30, 39], [40, 49]]

/** How the 5 numbers of each draw split across the five "decades" of the 1-49 pool. */
export function computeDecadeDistribution(draws: Draw[]): DecadeBucket[] {
	return DECADE_RANGES.map(([min, max]) => ({
		label: `${min}-${max}`,
		count: draws.reduce((total, d) => total + d.numbers.filter(n => n >= min && n <= max).length, 0)
	}))
}

export interface FrequencyExtreme {
	number: number
	count: number
}

export function computeFrequencyExtremes(
	draws: Draw[],
	topN = 5,
	poolSize = POOL_SIZE,
	pick: (d: Draw) => number[] = mainPick
): { top: FrequencyExtreme[]; bottom: FrequencyExtreme[] } {
	const entries = Object.entries(computeFrequency(draws, poolSize, pick)).map(([n, count]) => ({ number: Number(n), count }))
	const byCountDesc = [...entries].sort((a, b) => b.count - a.count || a.number - b.number)
	const byCountAsc = [...entries].sort((a, b) => a.count - b.count || a.number - b.number)
	return { top: byCountDesc.slice(0, topN), bottom: byCountAsc.slice(0, topN) }
}

export interface EcartLeader {
	number: number
	days: number
}

/** The number currently on the longest streak without appearing. */
export function computeCurrentEcartLeader(
	draws: Draw[],
	poolSize = POOL_SIZE,
	pick: (d: Draw) => number[] = mainPick
): EcartLeader | null {
	const entries = Object.entries(computeEcartDays(draws, poolSize, pick)).map(([n, days]) => ({ number: Number(n), days }))
	if (entries.length === 0) return null
	return entries.reduce((best, e) => (e.days > best.days ? e : best))
}

export interface EcartRecord extends EcartLeader {
	endDate: string | null
}

/** The single longest gap ever observed for any number in the pool, with the date it ended (null if it's the still-ongoing current gap). */
export function computeHistoricalEcartRecord(
	draws: Draw[],
	poolSize = POOL_SIZE,
	pick: (d: Draw) => number[] = mainPick
): EcartRecord | null {
	const sorted = sortByDate(draws)
	const referenceDate = sorted[sorted.length - 1]?.date
	if (!referenceDate) return null

	let best: EcartRecord | null = null
	for (let number = 1; number <= poolSize; number++) {
		const appearances = sorted.filter(d => pick(d).includes(number))
		if (appearances.length === 0) continue

		for (let i = 1; i < appearances.length; i++) {
			const days = daysBetween(appearances[i - 1].date, appearances[i].date)
			if (!best || days > best.days) best = { number, days, endDate: appearances[i].date }
		}

		const current = daysBetween(appearances[appearances.length - 1].date, referenceDate)
		if (!best || current > best.days) best = { number, days: current, endDate: null }
	}
	return best
}

export interface TripletStat {
	a: number
	b: number
	c: number
	count: number
}

export function computeTopTriplets(draws: Draw[], topN = 10): TripletStat[] {
	const counts = new Map<string, number>()
	for (const d of draws) {
		const sorted = [...d.numbers].sort((a, b) => a - b)
		for (let i = 0; i < sorted.length; i++) {
			for (let j = i + 1; j < sorted.length; j++) {
				for (let k = j + 1; k < sorted.length; k++) {
					const key = `${sorted[i]}-${sorted[j]}-${sorted[k]}`
					counts.set(key, (counts.get(key) ?? 0) + 1)
				}
			}
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, topN)
		.map(([key, count]) => {
			const [a, b, c] = key.split("-").map(Number)
			return { a, b, c, count }
		})
}

export function computeSumStats(draws: Draw[]): { min: number; max: number; average: number } {
	const sums = computeSumDistribution(draws)
	if (sums.length === 0) return { min: 0, max: 0, average: 0 }
	const total = sums.reduce((a, b) => a + b, 0)
	return { min: Math.min(...sums), max: Math.max(...sums), average: Math.round(total / sums.length) }
}

export function computeMonteCarloScores(
	draws: Draw[],
	poolSize = POOL_SIZE,
	pickCount = 5,
	pick: (d: Draw) => number[] = mainPick,
	iterations = MONTE_CARLO_ITERATIONS
): Record<number, number> {
	return normalize(computeMonteCarlo(draws, poolSize, pickCount, pick, iterations))
}

export interface ScoreBreakdown {
	frequency: number
	ecart: number
	montecarlo: number
	composite: number
}

export function computeScoreBreakdown(
	draws: Draw[],
	number: number,
	weights: Weights = DEFAULT_WEIGHTS,
	poolSize = POOL_SIZE,
	pickCount = 5,
	pick: (d: Draw) => number[] = mainPick
): ScoreBreakdown {
	const freq = computeFrequencyScores(draws, poolSize, pick)
	const ecart = computeEcartScores(draws, poolSize, pick)
	const monte = computeMonteCarloScores(draws, poolSize, pickCount, pick)

	const weightSum = weights.frequency + weights.ecart + weights.montecarlo || 1
	const wf = weights.frequency / weightSum
	const we = weights.ecart / weightSum
	const wm = weights.montecarlo / weightSum

	return {
		frequency: freq[number] ?? 0,
		ecart: ecart[number] ?? 0,
		montecarlo: monte[number] ?? 0,
		composite: wf * (freq[number] ?? 0) + we * (ecart[number] ?? 0) + wm * (monte[number] ?? 0)
	}
}

export function computeRank(scores: Record<number, number>, number: number): { rank: number; total: number } {
	const sorted = Object.entries(scores)
		.sort((a, b) => b[1] - a[1])
		.map(([n]) => Number(n))
	const idx = sorted.indexOf(number)
	return { rank: idx === -1 ? sorted.length : idx + 1, total: sorted.length }
}

export interface EcartHistoryStats {
	current: number
	record: number
	average: number
	gapsCount: number
}

/** Full distribution of gaps between successive appearances of `number` (not just the current one). */
export function computeEcartHistory(draws: Draw[], number: number, pick: (d: Draw) => number[] = mainPick): EcartHistoryStats {
	const sorted = sortByDate(draws)
	const appearances = sorted.filter(d => pick(d).includes(number))
	const referenceDate = sorted[sorted.length - 1]?.date

	if (appearances.length === 0 || !referenceDate) {
		return { current: 9999, record: 9999, average: 9999, gapsCount: 0 }
	}

	const gaps: number[] = []
	for (let i = 1; i < appearances.length; i++) {
		gaps.push(daysBetween(appearances[i - 1].date, appearances[i].date))
	}

	const current = daysBetween(appearances[appearances.length - 1].date, referenceDate)
	const record = Math.max(current, ...gaps)
	const average = gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : current

	return { current, record, average, gapsCount: gaps.length }
}

export interface CoOccurrence {
	value: number
	count: number
}

/** For a main number: which chance numbers came up most often on the same draw. */
export function computeCoOccurringChance(draws: Draw[], number: number, topN = 3): CoOccurrence[] {
	const counts: Record<number, number> = {}
	for (const d of draws) {
		if (d.numbers.includes(number)) counts[d.chance] = (counts[d.chance] ?? 0) + 1
	}
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, topN)
		.map(([v, count]) => ({ value: Number(v), count }))
}

/** For a chance number: which main numbers came up most often on the same draw. */
export function computeCoOccurringMain(draws: Draw[], chanceNumber: number, topN = 5): CoOccurrence[] {
	const counts: Record<number, number> = {}
	for (const d of draws) {
		if (d.chance === chanceNumber) for (const n of d.numbers) counts[n] = (counts[n] ?? 0) + 1
	}
	return Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, topN)
		.map(([v, count]) => ({ value: Number(v), count }))
}

export function computeTopPairsForNumber(draws: Draw[], number: number, topN = 5): PairStat[] {
	const counts = new Map<number, number>()
	for (const d of draws) {
		if (!d.numbers.includes(number)) continue
		for (const n of d.numbers) {
			if (n === number) continue
			counts.set(n, (counts.get(n) ?? 0) + 1)
		}
	}
	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, topN)
		.map(([n, count]) => ({ a: number, b: n, count }))
}

export interface FullNumberProfile {
	number: number
	kind: NumberKind
	rank: number
	totalInPool: number
	frequency: number
	frequencyPct: number
	scoreBreakdown: ScoreBreakdown
	ecart: EcartHistoryStats
	parity: "pair" | "impair"
	category: "bas" | "haut" | null
	appearances: string[]
	topPairs: PairStat[]
	coOccurring: CoOccurrence[]
}

export function computeFullNumberProfile(
	draws: Draw[],
	number: number,
	kind: NumberKind,
	weights: Weights = DEFAULT_WEIGHTS
): FullNumberProfile {
	const isChance = kind === "chance"
	const pick = isChance ? chancePick : mainPick
	const poolSize = isChance ? CHANCE_POOL_SIZE : POOL_SIZE
	const pickCount = isChance ? 1 : 5
	const monteCarloIterations = isChance ? 4000 : MONTE_CARLO_ITERATIONS

	const scores = computeCompositeScores(draws, weights, poolSize, pickCount, pick, monteCarloIterations)
	const { rank, total } = computeRank(scores, number)
	const breakdown = computeScoreBreakdown(draws, number, weights, poolSize, pickCount, pick)
	const ecart = computeEcartHistory(draws, number, pick)

	const sorted = sortByDate(draws)
	const appearances = sorted
		.filter(d => pick(d).includes(number))
		.map(d => d.date)
		.reverse()

	return {
		number,
		kind,
		rank,
		totalInPool: total,
		frequency: appearances.length,
		frequencyPct: draws.length ? appearances.length / draws.length : 0,
		scoreBreakdown: breakdown,
		ecart,
		parity: number % 2 === 0 ? "pair" : "impair",
		category: isChance ? null : number <= 25 ? "bas" : "haut",
		appearances,
		topPairs: isChance ? [] : computeTopPairsForNumber(draws, number, 5),
		coOccurring: isChance ? computeCoOccurringMain(draws, number, 5) : computeCoOccurringChance(draws, number, 3)
	}
}
