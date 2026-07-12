import type { RecentDraw } from "../types"

export default function RecentDraws({ draws }: { draws: RecentDraw[] }) {
	if (draws.length === 0) {
		return <p className="empty-hint">Aucun tirage récent disponible.</p>
	}

	const sorted = [...draws].sort((a, b) => b.date.localeCompare(a.date))

	return (
		<ul className="draws-list">
			{sorted.map((draw) => (
				<li key={draw.date} className="draws-row">
					<span className="draws-date">
						{new Date(draw.date).toLocaleDateString("fr-FR", {
							day: "2-digit",
							month: "short",
							year: "numeric"
						})}
					</span>
					<span className="draws-balls">
						{draw.numbers.map((n, i) => (
							<span className="ball ball-sm" key={i}>{n}</span>
						))}
						<span className="ball ball-sm ball-chance" title="Numéro chance">{draw.chance}</span>
					</span>
				</li>
			))}
		</ul>
	)
}
