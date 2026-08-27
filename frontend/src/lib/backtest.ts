import type { Draw } from "../types"

export interface CandidateCombination {
	combination: number[]
	scoreSum: number
}

export interface BestCombinationResult extends CandidateCombination {
	chance: number | null
	combinationsScanned: number
	drawsTested: number
	avgMatches: number
	bestMatch: number
	matchDistribution: Record<number, number>
	randomBaselineAvg: number
	runnersUp: CandidateCombination[]
}

function combinationCount(poolSize: number, pickCount: number): number {
	let count = 1
	for (let i = 0; i < pickCount; i++) count = (count * (poolSize - i)) / (i + 1)
	return Math.round(count)
}

/** C(49, 5) — the full main-number combination space searched by findBestCombination. */
export const TOTAL_MAIN_COMBINATIONS = combinationCount(49, 5)

/**
 * Exhaustively scores every possible 5-number combination from the pool by the sum of the numbers'
 * composite scores, keeping only the `topN` best as it goes (no need to store all ~1.9M candidates).
 * Pure arithmetic over precomputed scores — fast enough (~50ms for the full 49-choose-5 space) to run
 * synchronously on the main thread.
 */
function findTopCombinationsByScore(scores: Record<number, number>, poolSize: number, topN: number): CandidateCombination[] {
	const top: CandidateCombination[] = []

	for (let a = 1; a <= poolSize - 4; a++) {
		const sa = scores[a] ?? 0
		for (let b = a + 1; b <= poolSize - 3; b++) {
			const sab = sa + (scores[b] ?? 0)
			for (let c = b + 1; c <= poolSize - 2; c++) {
				const sabc = sab + (scores[c] ?? 0)
				for (let d = c + 1; d <= poolSize - 1; d++) {
					const sabcd = sabc + (scores[d] ?? 0)
					for (let e = d + 1; e <= poolSize; e++) {
						const scoreSum = sabcd + (scores[e] ?? 0)
						if (top.length < topN) {
							top.push({ combination: [a, b, c, d, e], scoreSum })
							if (top.length === topN) top.sort((x, y) => x.scoreSum - y.scoreSum)
						} else if (scoreSum > top[0].scoreSum) {
							top[0] = { combination: [a, b, c, d, e], scoreSum }
							top.sort((x, y) => x.scoreSum - y.scoreSum)
						}
					}
				}
			}
		}
	}

	return top.sort((x, y) => y.scoreSum - x.scoreSum)
}

/** How the winning combination's 5 numbers would actually have matched against real historical draws. */
function backtestCombination(combination: number[], draws: Draw[]): Omit<BestCombinationResult, keyof CandidateCombination | "chance" | "combinationsScanned" | "runnersUp"> {
	const target = new Set(combination)
	const matchDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
	let totalMatches = 0
	let bestMatch = 0

	for (const d of draws) {
		const overlap = d.numbers.filter(n => target.has(n)).length
		matchDistribution[overlap]++
		totalMatches += overlap
		if (overlap > bestMatch) bestMatch = overlap
	}

	return {
		drawsTested: draws.length,
		avgMatches: draws.length ? totalMatches / draws.length : 0,
		bestMatch,
		matchDistribution,
		randomBaselineAvg: 5 * (5 / 49)
	}
}

/**
 * Exhaustively searches the full 49-choose-5 space for the combination with the highest summed
 * composite score, then backtests that winner (and a few runners-up) against real history. This is
 * necessarily a hindsight optimization — see the disclaimer in the UI.
 */
export function findBestCombination(
	draws: Draw[],
	scores: Record<number, number>,
	chanceScores: Record<number, number> | null = null,
	verificationDraws: Draw[] = draws,
	poolSize = 49,
	runnersUpCount = 4
): BestCombinationResult {
	const top = findTopCombinationsByScore(scores, poolSize, runnersUpCount + 1)
	const winner = top[0]

	const chance = chanceScores
		? Number(Object.entries(chanceScores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null) || null
		: null

	return {
		...winner,
		chance,
		combinationsScanned: combinationCount(poolSize, 5),
		runnersUp: top.slice(1),
		...backtestCombination(winner.combination, verificationDraws)
	}
}
