import type { Draw } from "../types"
import { DEFAULT_WEIGHTS, computeCompositeScores, sortByDate, topPredictions, type Weights } from "./stats"

export interface BacktestResult {
	drawsTested: number
	avgMatches: number
	matchDistribution: Record<number, number>
	randomBaselineAvg: number
}

const RANDOM_BASELINE_AVG = 5 * (5 / 49)

/**
 * Walk-forward backtest: for each of the last `windowSize` draws, scores are
 * computed using only draws strictly before it (no lookahead), so the result
 * reflects what the tool would genuinely have predicted at the time.
 */
export function runBacktest(
	draws: Draw[],
	windowSize = 50,
	weights: Weights = DEFAULT_WEIGHTS,
	monteCarloIterations = 3000
): BacktestResult {
	const sorted = sortByDate(draws)
	const n = sorted.length
	const minHistory = 20
	const start = Math.max(minHistory, n - windowSize)

	const matchDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
	let totalMatches = 0
	let tested = 0

	for (let i = start; i < n; i++) {
		const history = sorted.slice(0, i)
		const scores = computeCompositeScores(history, weights, 49, 5, d => d.numbers, monteCarloIterations)
		const predicted = topPredictions(scores, 5)
		const actual = new Set(sorted[i].numbers)
		const matches = predicted.filter(p => actual.has(p)).length

		matchDistribution[matches]++
		totalMatches += matches
		tested++
	}

	return {
		drawsTested: tested,
		avgMatches: tested ? totalMatches / tested : 0,
		matchDistribution,
		randomBaselineAvg: RANDOM_BASELINE_AVG
	}
}
