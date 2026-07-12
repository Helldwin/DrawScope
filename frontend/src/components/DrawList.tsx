import type { NumberKind } from "../lib/stats"
import type { Draw } from "../types"

export default function DrawList({
	draws,
	onSelect,
	sortDescending = true
}: {
	draws: Draw[]
	onSelect?: (n: number, kind: NumberKind) => void
	sortDescending?: boolean
}) {
	if (draws.length === 0) {
		return <p className="empty-hint">Aucun tirage disponible.</p>
	}

	const sorted = [...draws].sort((a, b) => (sortDescending ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))

	return (
		<ul className="draws-list">
			{sorted.map(draw => (
				<li key={draw.date} className="draws-row">
					<span className="draws-date">
						{new Date(draw.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
					</span>
					<span className="draws-balls">
						{draw.numbers.map((n, i) => (
							<button className="ball ball-sm" key={i} onClick={() => onSelect?.(n, "main")} title={`Numéro ${n}`}>
								{n}
							</button>
						))}
						<button className="ball ball-sm ball-chance" onClick={() => onSelect?.(draw.chance, "chance")} title="Numéro chance">
							{draw.chance}
						</button>
					</span>
				</li>
			))}
		</ul>
	)
}
