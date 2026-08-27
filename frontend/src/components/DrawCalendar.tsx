import { useMemo } from "react"
import { buildYearCalendar, monthLabelsFor, sumOf } from "../lib/calendar"
import type { HistoryEntry } from "../lib/history"

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"]
const CELL = 11
const GAP = 3
const STEP = CELL + GAP

function intensityColor(sum: number): string {
	const clamped = Math.max(0, Math.min(1, (sum - 40) / 170))
	const hue = 220 - 220 * clamped
	return `hsl(${hue.toFixed(0)}, 65%, 50%)`
}

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function DrawCalendar({ year, entries }: { year: number; entries: HistoryEntry[] }) {
	const weeks = useMemo(() => buildYearCalendar(year, entries), [year, entries])
	const monthLabels = useMemo(() => monthLabelsFor(weeks), [weeks])
	const drawCount = useMemo(() => weeks.reduce((n, w) => n + w.cells.filter(c => c.entry).length, 0), [weeks])

	return (
		<div className="calendar-wrap">
			<div className="calendar-scroll">
				<div className="calendar-months">
					{monthLabels.map(m => (
						<span key={m.weekIndex} className="calendar-month-label" style={{ left: m.weekIndex * STEP }}>{m.label}</span>
					))}
				</div>
				<div className="calendar-body">
					<div className="calendar-day-labels">
						{DAY_LABELS.map((d, i) => (
							<span key={i} className="calendar-day-label">{i % 2 === 1 ? d : ""}</span>
						))}
					</div>
					<div className="calendar-grid">
						{weeks.map((week, wi) => (
							<div className="calendar-week" key={wi}>
								{week.cells.map((cell, di) => (
									<div
										key={di}
										className={cell.entry ? "calendar-cell has-draw" : cell.inYear ? "calendar-cell" : "calendar-cell out-of-year"}
										style={cell.entry ? { background: intensityColor(sumOf(cell.entry)) } : undefined}
										title={cell.entry ? `${formatDate(cell.date)} — ${cell.entry.numbers.join(", ")}` : cell.inYear ? formatDate(cell.date) : undefined}
									/>
								))}
							</div>
						))}
					</div>
				</div>
			</div>
			<div className="legend">
				<span className="legend-label">Somme faible</span>
				<span className="legend-bar" aria-hidden="true" />
				<span className="legend-label">Somme élevée</span>
			</div>
			<p className="rule-hint">{drawCount} tirages représentés sur {year}.</p>
		</div>
	)
}
