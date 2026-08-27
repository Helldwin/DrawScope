import InfoTooltip from "./InfoTooltip"
import { DEFAULT_WEIGHTS, type Weights } from "../lib/stats"

const LABELS: Record<keyof Weights, string> = {
	frequency: "Fréquence",
	ecart: "Écart (retard)",
	montecarlo: "Simulation Monte Carlo"
}

const EXPLANATIONS: Record<keyof Weights, string> = {
	frequency: "Combien de fois ce numéro est sorti dans l'historique disponible. Plus il est sorti souvent, plus ce critère le favorise.",
	ecart: "Le nombre de tirages depuis sa dernière sortie. Un numéro « en retard » est mis en avant par ce critère, sur l'idée qu'il finit par revenir.",
	montecarlo: "Une simulation qui tire des milliers de grilles aléatoires pondérées par l'historique, pour lisser les deux critères précédents."
}

export default function WeightSliders({ weights, onChange }: { weights: Weights; onChange: (w: Weights) => void }) {
	const total = weights.frequency + weights.ecart + weights.montecarlo || 1

	const update = (key: keyof Weights, value: number) => {
		onChange({ ...weights, [key]: value })
	}

	return (
		<div className="weights-panel">
			<div className="card-header">
				<div>
					<h3>Pondération du score</h3>
					<p className="card-subtitle">Ajuste l'importance de chaque critère dans le calcul.</p>
				</div>
				<button className="btn-ghost" onClick={() => onChange(DEFAULT_WEIGHTS)}>Réinitialiser</button>
			</div>
			{(Object.keys(LABELS) as (keyof Weights)[]).map(key => (
				<label key={key} className="weight-slider">
					<span className="weight-name">
						{LABELS[key]}
						<InfoTooltip text={EXPLANATIONS[key]} />
					</span>
					<input
						type="range"
						min={0}
						max={1}
						step={0.05}
						value={weights[key]}
						onChange={e => update(key, Number(e.target.value))}
					/>
					<span className="weight-value">{Math.round((weights[key] / total) * 100)}%</span>
				</label>
			))}
		</div>
	)
}
