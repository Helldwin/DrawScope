import { useState } from "react"
import Histogram from "../charts/Histogram"
import { runBacktest, type BacktestResult } from "../../lib/backtest"
import type { Draw } from "../../types"

export default function BacktestTab({ draws }: { draws: Draw[] }) {
	const [windowSize, setWindowSize] = useState(50)
	const [running, setRunning] = useState(false)
	const [result, setResult] = useState<BacktestResult | null>(null)

	const run = () => {
		setRunning(true)
		setResult(null)
		// Deferred so the "Calcul en cours…" state actually paints before the
		// (synchronous, CPU-bound) backtest runs.
		setTimeout(() => {
			setResult(runBacktest(draws, windowSize))
			setRunning(false)
		}, 30)
	}

	return (
		<section className="card" aria-labelledby="backtest-title">
			<div className="card-header">
				<div>
					<h2 id="backtest-title">Backtest</h2>
					<p className="card-subtitle">Simule la stratégie sur l'historique réel, sans jamais regarder dans le futur.</p>
				</div>
			</div>

			<p className="disclaimer">
				⚠️ Le Loto est un jeu de hasard : ce backtest sert à vérifier honnêtement que la méthode ne fait pas mieux
				qu'un tirage aléatoire — ce n'est pas un outil de gain.
			</p>

			<div className="rule-field">
				<label htmlFor="window-select">Nombre de tirages testés</label>
				<select id="window-select" value={windowSize} onChange={e => setWindowSize(Number(e.target.value))}>
					<option value={20}>20 derniers tirages</option>
					<option value={50}>50 derniers tirages</option>
					<option value={100}>100 derniers tirages</option>
				</select>
			</div>

			<button className="btn" onClick={run} disabled={running}>
				{running ? "Calcul en cours…" : "Lancer le backtest"}
			</button>

			{result && (
				<div className="backtest-result">
					<div className="modal-stats">
						<div className="modal-stat">
							<span className="modal-stat-value">{result.avgMatches.toFixed(2)}</span>
							<span className="modal-stat-label">bons numéros / tirage (méthode)</span>
						</div>
						<div className="modal-stat">
							<span className="modal-stat-value">{result.randomBaselineAvg.toFixed(2)}</span>
							<span className="modal-stat-label">attendu au hasard pur</span>
						</div>
						<div className="modal-stat">
							<span className="modal-stat-value">{result.drawsTested}</span>
							<span className="modal-stat-label">tirages testés</span>
						</div>
					</div>

					<h3 className="modal-section-title">Répartition des bons numéros trouvés</h3>
					<Histogram
						buckets={Object.entries(result.matchDistribution).map(([k, v]) => ({ label: k, count: v }))}
					/>

					<p className="card-subtitle backtest-verdict">
						{result.avgMatches <= result.randomBaselineAvg * 1.15
							? "Comme attendu pour un jeu de hasard, la méthode ne bat pas significativement le hasard pur."
							: "La méthode fait légèrement mieux que le hasard sur cet échantillon — à interpréter comme du bruit statistique, pas comme un signal fiable, étant donné la nature du Loto."}
					</p>
				</div>
			)}
		</section>
	)
}
