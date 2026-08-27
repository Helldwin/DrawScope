import type { HistoryEntry } from "./history"

export interface CalendarCell {
	date: string
	entry: HistoryEntry | null
	inYear: boolean
}

export interface CalendarWeek {
	cells: CalendarCell[]
}

function toIso(d: Date): string {
	return d.toISOString().slice(0, 10)
}

/** Monday-first calendar grid for `year`, padded to whole weeks so every week has exactly 7 cells. */
export function buildYearCalendar(year: number, entries: HistoryEntry[]): CalendarWeek[] {
	const byDate = new Map(entries.map(e => [e.date, e]))

	const start = new Date(Date.UTC(year, 0, 1))
	const end = new Date(Date.UTC(year, 11, 31))

	const startDow = (start.getUTCDay() + 6) % 7 // 0 = Monday
	const gridStart = new Date(start)
	gridStart.setUTCDate(gridStart.getUTCDate() - startDow)

	const endDow = (end.getUTCDay() + 6) % 7
	const gridEnd = new Date(end)
	gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - endDow))

	const weeks: CalendarWeek[] = []
	const cursor = new Date(gridStart)
	while (cursor <= gridEnd) {
		const cells: CalendarCell[] = []
		for (let i = 0; i < 7; i++) {
			const iso = toIso(cursor)
			cells.push({ date: iso, entry: byDate.get(iso) ?? null, inYear: cursor.getUTCFullYear() === year })
			cursor.setUTCDate(cursor.getUTCDate() + 1)
		}
		weeks.push({ cells })
	}
	return weeks
}

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"]

export function monthLabelsFor(weeks: CalendarWeek[]): { weekIndex: number; label: string }[] {
	const labels: { weekIndex: number; label: string }[] = []
	let lastMonth = -1
	weeks.forEach((week, wi) => {
		const month = Number(week.cells[0].date.slice(5, 7))
		if (month !== lastMonth) {
			labels.push({ weekIndex: wi, label: MONTH_LABELS[month - 1] })
			lastMonth = month
		}
	})
	return labels
}

export function sumOf(entry: { numbers: number[] }): number {
	return entry.numbers.reduce((a, b) => a + b, 0)
}
