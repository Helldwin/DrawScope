import DrawList from "../DrawList"
import Heatmap from "../Heatmap"
import Predictions from "../Predictions"
import WeightSliders from "../WeightSliders"
import type { NumberKind, Weights } from "../../lib/stats"
import { sortByDate } from "../../lib/stats"
import type { Draw } from "../../types"

export default function OverviewTab({
	draws,
	weights,
	onWeightsChange,
	scores,
	predictions,
	chancePrediction,
	onSelect,
	onNavigateHistory
}: {
	draws: Draw[]
	weights: Weights
	onWeightsChange: (w: Weights) => void
	scores: Record<number, number>
	predictions: number[]
	chancePrediction: number | null
	onSelect: (n: number, kind: NumberKind) => void
	onNavigateHistory: () => void
}) {
	const recent = sortByDate(draws).slice(-5)

	return (
		<>
			<WeightSliders weights={weights} onChange={onWeightsChange} />
			<Predictions numbers={predictions} scores={scores as Record<string, number>} chanceNumber={chancePrediction} onSelect={onSelect} />
			<Heatmap scores={scores as Record<string, number>} onSelect={onSelect} />

			<section className="card" aria-labelledby="recent-title">
				<div className="card-header">
					<div>
						<h2 id="recent-title">Derniers tirages</h2>
						<p className="card-subtitle">Les 5 tirages les plus récents.</p>
					</div>
					<button className="btn-ghost" onClick={onNavigateHistory}>Voir tout l'historique</button>
				</div>
				<DrawList draws={recent} onSelect={onSelect} />
			</section>
		</>
	)
}
