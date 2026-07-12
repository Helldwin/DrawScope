import { useState } from "react"
import { evaluateGridAgainstHistory, type GridEvaluation } from "../lib/stats"
import type { Draw } from "../types"

export default function GridCheckerCard({ draws, scores }: { draws: Draw[]; scores: Record<number, number> }) {
	const [inputs, setInputs] = useState(["", "", "", "", ""])
	const [error, setError] = useState<string | null>(null)
	const [result, setResult] = useState<{ numbers: number[]; totalScore: number; evaluation: GridEvaluation } | null>(null)

	const updateInput = (i: number, value: string) => {
		const next = [...inputs]
		next[i] = value.replace(/[^0-9]/g, "")
		setInputs(next)
	}

	const check = () => {
		const numbers = inputs.map(Number)
		if (numbers.some(n => !n || n < 1 || n > 49)) {
			setError("Entre 5 numéros valides, entre 1 et 49.")
			setResult(null)
			return
		}
		if (new Set(numbers).size !== 5) {
			setError("Les 5 numéros doivent être différents.")
			setResult(null)
			return
		}
		setError(null)
		const totalScore = numbers.reduce((a, n) => a + (scores[n] ?? 0), 0)
		setResult({ numbers, totalScore, evaluation: evaluateGridAgainstHistory(draws, numbers) })
	}

	return (
		<section className="card" aria-labelledby="checker-title">
			<div className="card-header">
				<div>
					<h2 id="checker-title">Vérificateur de grille</h2>
					<p className="card-subtitle">Entre tes propres numéros pour voir leur score et leur historique.</p>
				</div>
			</div>

			<div className="grid-checker-inputs">
				{inputs.map((v, i) => (
					<input
						key={i}
						type="text"
						inputMode="numeric"
						maxLength={2}
						className="grid-checker-input"
						value={v}
						onChange={e => updateInput(i, e.target.value)}
						aria-label={`Numéro ${i + 1}`}
					/>
				))}
				<button className="btn" onClick={check}>Vérifier</button>
			</div>

			{error && <p className="empty-hint">{error}</p>}

			{result && (
				<div className="grid-checker-result">
					<p>Score composite moyen : <strong>{Math.round((result.totalScore / 5) * 100)}%</strong></p>
					{result.evaluation.exactMatches > 0 ? (
						<p>Cette combinaison exacte est déjà sortie {result.evaluation.exactMatches} fois.</p>
					) : (
						<p>Cette combinaison exacte n'est jamais sortie sur l'historique disponible.</p>
					)}
					{result.evaluation.bestMatchDate && (
						<p>
							Meilleure correspondance historique : {result.evaluation.bestMatches} numéro(s) commun(s) le{" "}
							{new Date(result.evaluation.bestMatchDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}.
						</p>
					)}
				</div>
			)}
		</section>
	)
}
