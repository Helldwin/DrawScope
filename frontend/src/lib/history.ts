import type { Draw, LegacyDraw, WinnersByDate } from "../types"

export type HistoryEntry =
	| ({ format: "modern" } & Draw)
	| ({ format: "legacy" } & LegacyDraw)

export function mergeHistoryEntries(modern: Draw[], legacy: LegacyDraw[] = []): HistoryEntry[] {
	return [
		...modern.map(d => ({ format: "modern" as const, ...d })),
		...legacy.map(d => ({ format: "legacy" as const, ...d }))
	]
}

export function sortEntriesByDateDesc(entries: HistoryEntry[]): HistoryEntry[] {
	return [...entries].sort((a, b) => b.date.localeCompare(a.date))
}

export function yearOf(entry: { date: string }): number {
	return Number(entry.date.slice(0, 4))
}

export function availableYears(entries: { date: string }[]): number[] {
	const years = new Set(entries.map(yearOf))
	return [...years].sort((a, b) => b - a)
}

export function filterByYear<T extends { date: string }>(entries: T[], year: number | null): T[] {
	if (year === null) return entries
	return entries.filter(e => yearOf(e) === year)
}

export function parseNumberList(input: string, poolSize = 49): number[] {
	return [
		...new Set(
			input
				.split(",")
				.map(s => Number(s.trim()))
				.filter(n => Number.isInteger(n) && n >= 1 && n <= poolSize)
		)
	]
}

/** Keeps only entries whose main numbers include every one of `numbers` (chance/complémentaire excluded). */
export function filterByNumbers<T extends { numbers: number[] }>(entries: T[], numbers: number[]): T[] {
	if (numbers.length === 0) return entries
	return entries.filter(e => numbers.every(n => e.numbers.includes(n)))
}

/** Fills in `winners` on modern entries from the lazily-fetched winners-by-date lookup (archive entries already carry it inline). */
export function withWinners(entries: HistoryEntry[], winnersByDate: WinnersByDate | null): HistoryEntry[] {
	if (!winnersByDate) return entries
	return entries.map(e => (e.winners || e.format !== "modern" ? e : winnersByDate[e.date] ? { ...e, winners: winnersByDate[e.date] } : e))
}
