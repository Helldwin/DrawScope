import { useMemo, useState } from "react"
import type { NumberKind } from "../lib/stats"

type SortMode = "number" | "score"

function scoreColor(value: number) {
	const clamped = Math.max(0, Math.min(1, value))
	const hue = 220 - 220 * clamped
	const light = 42 + 6 * (1 - clamped)
	return `hsl(${hue.toFixed(0)}, 70%, ${light.toFixed(0)}%)`
}

export default function Heatmap({
	scores,
	onSelect,
	kind = "main",
	title = "Score par numéro",
	subtitle = "Fréquence, écart et simulation combinés pour chacun des 49 numéros.",
	showSearch = true
}: {
	scores: Record<string, number>
	onSelect?: (n: number, kind: NumberKind) => void
	kind?: NumberKind
	title?: string
	subtitle?: string
	showSearch?: boolean
}) {
	const [sortMode, setSortMode] = useState<SortMode>("number")
	const [query, setQuery] = useState("")

	const entries = useMemo(() => {
		const list = Object.entries(scores).map(([num, val]) => ({ num: Number(num), val }))
		if (sortMode === "score") {
			list.sort((a, b) => b.val - a.val)
		} else {
			list.sort((a, b) => a.num - b.num)
		}
		return list
	}, [scores, sortMode])

	const highlighted = query.trim() ? Number(query.trim()) : null

	return (
		<section className="card" aria-labelledby={`heatmap-title-${kind}`}>
			<div className="card-header">
				<div>
					<h2 id={`heatmap-title-${kind}`}>{title}</h2>
					<p className="card-subtitle">{subtitle}</p>
				</div>
				<div className="segmented" role="group" aria-label="Trier la grille">
					<button
						className={sortMode === "number" ? "segmented-btn active" : "segmented-btn"}
						onClick={() => setSortMode("number")}
						aria-pressed={sortMode === "number"}
					>
						N° croissant
					</button>
					<button
						className={sortMode === "score" ? "segmented-btn active" : "segmented-btn"}
						onClick={() => setSortMode("score")}
						aria-pressed={sortMode === "score"}
					>
						Score décroissant
					</button>
				</div>
			</div>

			{showSearch && (
				<input
					type="search"
					inputMode="numeric"
					placeholder={`Rechercher un numéro (1-${entries.length})…`}
					className="search-input"
					value={query}
					onChange={e => setQuery(e.target.value.replace(/[^0-9]/g, ""))}
					aria-label="Rechercher un numéro"
				/>
			)}

			<div className="heatmap-grid" role="grid" aria-label="Score de chaque numéro">
				{entries.map(({ num, val }) => (
					<button
						key={num}
						role="gridcell"
						className={highlighted === num ? "heatmap-cell highlighted" : "heatmap-cell"}
						style={{ background: scoreColor(val) }}
						title={`Numéro ${num} — score ${(val * 100).toFixed(0)}% — voir la fiche détaillée`}
						onClick={() => onSelect?.(num, kind)}
					>
						{num}
					</button>
				))}
			</div>

			<div className="legend">
				<span className="legend-label">Faible</span>
				<span className="legend-bar" aria-hidden="true" />
				<span className="legend-label">Élevé</span>
			</div>
		</section>
	)
}
