import { useState } from "react"
import Histogram from "../charts/Histogram"
import { findBestCombination, TOTAL_MAIN_COMBINATIONS, type BestCombinationResult } from "../../lib/backtest"
import { computeEcartScores, computeFrequencyScores, sortByDate } from "../../lib/stats"
import type { Draw } from "../../types"

const WINDOW_OPTIONS: { value: number; label: string }[] = [
	{ value: 20, label: "20 derniers tirages" },
	{ value: 50, label: "50 derniers tirages" },
	{ value: 100, label: "100 derniers tirages" },
	{ value: 0, label: "Tout l'historique" }
]

interface StrategyResult {
	id: string
	label: string
	result: BestCombinationResult
}

export default function BacktestTab({
	draws,
	scores,
	chanceScores
}: {
	draws: Draw[]
	scores: Record<number, number>
	chanceScores: Record<number, number>
}) {
	const [windowSize, setWindowSize] = useState(0)
	const [running, setRunning] = useState(false)
	const [strategies, setStrategies] = useState<StrategyResult[] | null>(null)

	const run = () => {
		setRunning(true)
		setStrategies(null)
		// Deferred so the "Analyse en cours…" state actually paints before the
		// (synchronous, CPU-bound) exhaustive searches run.
		setTimeout(() => {
			const verificationDraws = windowSize === 0 ? draws : sortByDate(draws).slice(-windowSize)
			const frequencyScores = computeFrequencyScores(draws)
			const ecartScores = computeEcartScores(draws)

			setStrategies([
				{ id: "composite", label: "Score composite", result: findBestCombination(draws, scores, chanceScores, verificationDraws) },
				{ id: "frequency", label: "Fréquence pure", result: findBestCombination(draws, frequencyScores, null, verificationDraws) },
				{ id: "ecart", label: "Écart pur", result: findBestCombination(draws, ecartScores, null, verificationDraws) }
			])
			setRunning(false)
		}, 30)
	}

	const primary = strategies?.find(s => s.id === "composite") ?? null
	const others = strategies?.filter(s => s.id !== "composite") ?? []

	return (
		<section className="card" aria-labelledby="backtest-title">
			<div className="card-header">
				<div>
					<h2 id="backtest-title">Backtest — meilleure combinaison</h2>
					<p className="card-subtitle">
						Passe en revue les {TOTAL_MAIN_COMBINATIONS.toLocaleString("fr-FR")} combinaisons possibles selon 3 approches
						de score, puis vérifie leurs performances sur l'historique réel.
					</p>
				</div>
			</div>

			<p className="disclaimer">
				⚠️ Le Loto est un jeu de hasard pur : chercher « la meilleure combinaison » dans les données passées est une
				optimisation a posteriori — rien ne garantit qu'elle fera mieux qu'une combinaison aléatoire pour les tirages
				à venir. Ce n'est pas un outil de gain.
			</p>

			<div className="rule-field">
				<label htmlFor="window-select">Vérifier les performances sur</label>
				<select id="window-select" value={windowSize} onChange={e => setWindowSize(Number(e.target.value))}>
					{WINDOW_OPTIONS.map(o => (
						<option key={o.value} value={o.value}>{o.label}</option>
					))}
				</select>
			</div>

			<button className="btn" onClick={run} disabled={running}>
				{running ? "Analyse en cours…" : "Comparer les stratégies"}
			</button>

			{primary && (
				<div className="backtest-result">
					<h3 className="modal-section-title">Combinaison retenue (score composite)</h3>
					<div className="predictions-row">
						{primary.result.combination.map((n, i) => (
							<span className="ball ball-lg ball-static" key={i}>{n}</span>
						))}
						{primary.result.chance !== null && (
							<span className="ball ball-lg ball-chance ball-static">
								{primary.result.chance}
								<small>chance</small>
							</span>
						)}
					</div>

					<div className="modal-stats">
						<div className="modal-stat">
							<span className="modal-stat-value">{primary.result.combinationsScanned.toLocaleString("fr-FR")}</span>
							<span className="modal-stat-label">combinaisons passées en revue</span>
						</div>
						<div className="modal-stat">
							<span className="modal-stat-value">{primary.result.avgMatches.toFixed(2)}</span>
							<span className="modal-stat-label">bons numéros / tirage (moyenne)</span>
						</div>
						<div className="modal-stat">
							<span className="modal-stat-value">{primary.result.randomBaselineAvg.toFixed(2)}</span>
							<span className="modal-stat-label">attendu au hasard pur</span>
						</div>
					</div>

					<h3 className="modal-section-title">Répartition des bons numéros trouvés ({primary.result.drawsTested} tirages)</h3>
					<Histogram
						buckets={Object.entries(primary.result.matchDistribution).map(([k, v]) => ({ label: k, count: v }))}
					/>

					<p className="card-subtitle backtest-verdict">
						{primary.result.avgMatches <= primary.result.randomBaselineAvg * 1.15
							? "Comme attendu pour un jeu de hasard, cette combinaison ne bat pas significativement le hasard pur, malgré l'optimisation."
							: "Cette combinaison fait légèrement mieux que le hasard sur cet échantillon — à interpréter comme du bruit statistique issu de l'optimisation a posteriori, pas comme un signal fiable."}
						{" "}Son meilleur résultat historique est {primary.result.bestMatch} bon{primary.result.bestMatch > 1 ? "s" : ""}{" "}
						numéro{primary.result.bestMatch > 1 ? "s" : ""} sur un même tirage.
					</p>

					<h3 className="modal-section-title">Comparaison avec d'autres approches</h3>
					<p className="card-subtitle">
						Chaque approche cherche sa propre meilleure combinaison sur les mêmes {primary.result.drawsTested} tirages de
						vérification — pour montrer qu'aucune ne s'en sort vraiment mieux que le hasard pur (à {primary.result.randomBaselineAvg.toFixed(2)}).
					</p>
					<div className="multigrids-list">
						<div className="multigrid-row">
							<div className="multigrid-label">
								<strong>Score composite</strong>
								<span className="card-subtitle">{primary.result.avgMatches.toFixed(2)} bons numéros / tirage</span>
							</div>
							<div className="draws-balls">
								{primary.result.combination.map((n, j) => (
									<span className="ball ball-sm ball-static" key={j}>{n}</span>
								))}
							</div>
						</div>
						{others.map(s => (
							<div className="multigrid-row" key={s.id}>
								<div className="multigrid-label">
									<strong>{s.label}</strong>
									<span className="card-subtitle">{s.result.avgMatches.toFixed(2)} bons numéros / tirage</span>
								</div>
								<div className="draws-balls">
									{s.result.combination.map((n, j) => (
										<span className="ball ball-sm ball-static" key={j}>{n}</span>
									))}
								</div>
							</div>
						))}
						<div className="multigrid-row">
							<div className="multigrid-label">
								<strong>Hasard pur</strong>
								<span className="card-subtitle">{primary.result.randomBaselineAvg.toFixed(2)} bons numéros / tirage (théorique)</span>
							</div>
							<span className="empty-hint">n'importe quelle grille</span>
						</div>
					</div>

					{primary.result.runnersUp.length > 0 && (
						<>
							<h3 className="modal-section-title">Suivantes au classement (score composite)</h3>
							<div className="multigrids-list">
								{primary.result.runnersUp.map((r, i) => (
									<div className="multigrid-row" key={i}>
										<div className="multigrid-label">
											<strong>#{i + 2}</strong>
											<span className="card-subtitle">Score {(r.scoreSum * 20).toFixed(0)}%</span>
										</div>
										<div className="draws-balls">
											{r.combination.map((n, j) => (
												<span className="ball ball-sm ball-static" key={j}>{n}</span>
											))}
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</div>
			)}
		</section>
	)
}
