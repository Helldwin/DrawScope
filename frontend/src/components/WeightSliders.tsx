import { DEFAULT_WEIGHTS, type Weights } from "../lib/stats"

const LABELS: Record<keyof Weights, string> = {
	frequency: "Fréquence",
	ecart: "Écart (retard)",
	montecarlo: "Simulation Monte Carlo"
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
					<span className="weight-name">{LABELS[key]}</span>
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
