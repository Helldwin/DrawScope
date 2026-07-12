import { useMemo, useState } from "react"

type SortMode = "number" | "score"

function scoreColor(value: number) {
	// Cool -> warm sequential scale (blue to amber/red), colorblind-friendlier than red/green.
	const hue = 220 - 220 * value
	const light = 42 + 6 * (1 - value)
	return `hsl(${hue.toFixed(0)}, 70%, ${light.toFixed(0)}%)`
}

export default function Heatmap({ scores }: { scores: Record<string, number> }) {
	const [sortMode, setSortMode] = useState<SortMode>("number")

	const entries = useMemo(() => {
		const list = Object.entries(scores).map(([num, val]) => ({ num: Number(num), val }))
		if (sortMode === "score") {
			list.sort((a, b) => b.val - a.val)
		} else {
			list.sort((a, b) => a.num - b.num)
		}
		return list
	}, [scores, sortMode])

	return (
		<section className="card" aria-labelledby="heatmap-title">
			<div className="card-header">
				<div>
					<h2 id="heatmap-title">Score par numéro</h2>
					<p className="card-subtitle">Fréquence, écart et simulation combinés pour chacun des 49 numéros.</p>
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

			<div className="heatmap-grid" role="grid" aria-label="Score de chaque numéro du Loto">
				{entries.map(({ num, val }) => (
					<div
						key={num}
						role="gridcell"
						tabIndex={0}
						className="heatmap-cell"
						style={{ background: scoreColor(val) }}
						title={`Numéro ${num} — score ${(val * 100).toFixed(0)}%`}
					>
						{num}
					</div>
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
