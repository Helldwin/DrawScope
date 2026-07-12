import { useMemo, useState } from "react"
import { computeEcartScores, computeFrequencyScores } from "../lib/stats"
import { DEFAULT_RULES, generateMultipleGrids, type GridStrategy } from "../lib/rules"
import type { Draw } from "../types"

export default function MultiGridsCard({
	draws,
	compositeScores,
	onSelect
}: {
	draws: Draw[]
	compositeScores: Record<number, number>
	onSelect: (n: number) => void
}) {
	const [version, setVersion] = useState(0)

	const strategies: GridStrategy[] = useMemo(() => {
		const frequencyScores = computeFrequencyScores(draws)
		const ecartScores = computeEcartScores(draws)
		return [
			{
				id: "composite",
				label: "Score composite",
				description: "Combine fréquence, écart et simulation.",
				scores: compositeScores,
				rules: DEFAULT_RULES
			},
			{
				id: "hot",
				label: "Numéros chauds",
				description: "Privilégie les numéros les plus fréquents.",
				scores: frequencyScores,
				rules: DEFAULT_RULES
			},
			{
				id: "cold",
				label: "Numéros froids",
				description: "Privilégie les numéros en retard.",
				scores: ecartScores,
				rules: DEFAULT_RULES
			},
			{
				id: "balanced",
				label: "Équilibrée",
				description: "Parité équilibrée, sans numéros consécutifs.",
				scores: compositeScores,
				rules: { ...DEFAULT_RULES, parity: "balanced", avoidConsecutive: true }
			}
		]
	}, [draws, compositeScores, version])

	const grids = useMemo(() => generateMultipleGrids(strategies), [strategies])

	return (
		<section className="card" aria-labelledby="multigrids-title">
			<div className="card-header">
				<div>
					<h2 id="multigrids-title">Grilles multiples</h2>
					<p className="card-subtitle">Plusieurs stratégies différentes, à titre de comparaison.</p>
				</div>
				<button className="btn-ghost" onClick={() => setVersion(v => v + 1)}>Régénérer</button>
			</div>

			<div className="multigrids-list">
				{grids.map(({ strategy, grid }) => (
					<div className="multigrid-row" key={strategy.id}>
						<div className="multigrid-label">
							<strong>{strategy.label}</strong>
							<span className="card-subtitle">{strategy.description}</span>
						</div>
						<div className="draws-balls">
							{grid ? grid.map((n, i) => (
								<button className="ball ball-sm" key={i} onClick={() => onSelect(n)}>{n}</button>
							)) : <span className="empty-hint">Non trouvée</span>}
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
