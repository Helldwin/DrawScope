import { useEffect, useState } from "react"
import { addSavedGrid, isGridSaved, loadSavedGrids } from "../lib/myGrids"
import type { NumberKind } from "../lib/stats"

export default function Predictions({
	numbers,
	scores,
	chanceNumber,
	onSelect
}: {
	numbers: number[]
	scores: Record<string, number>
	chanceNumber: number | null
	onSelect?: (n: number, kind: NumberKind) => void
}) {
	const [copied, setCopied] = useState(false)
	const [saved, setSaved] = useState(false)

	useEffect(() => {
		setSaved(isGridSaved(numbers, loadSavedGrids()))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [numbers.join(",")])

	if (numbers.length === 0) {
		return <p className="empty-hint">Aucune prédiction disponible pour le moment.</p>
	}

	const shareText = `DrawScope — grille suggérée : ${numbers.join(" - ")}${chanceNumber ? ` (chance ${chanceNumber})` : ""}`

	const share = async () => {
		if (navigator.share) {
			try {
				await navigator.share({ text: shareText })
				return
			} catch {
				// user cancelled or share unsupported for this payload, fall through to clipboard
			}
		}
		await navigator.clipboard.writeText(shareText)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const save = () => {
		addSavedGrid(numbers, chanceNumber)
		setSaved(true)
	}

	return (
		<section className="card" aria-labelledby="predictions-title">
			<div className="card-header">
				<div>
					<h2 id="predictions-title">🎯 Combinaison suggérée</h2>
					<p className="card-subtitle">Les 5 numéros au score composite le plus élevé.</p>
				</div>
				<div className="card-header-actions">
					<button className="btn-ghost save-grid-btn" onClick={save} disabled={saved}>{saved ? "★ Enregistrée" : "☆ Enregistrer"}</button>
					<button className="btn-ghost" onClick={share}>{copied ? "Copié !" : "Partager"}</button>
				</div>
			</div>

			<div className="predictions-row">
				{numbers.map((n, i) => (
					<button className="ball ball-lg" key={i} onClick={() => onSelect?.(n, "main")} title="Voir la fiche détaillée">
						<span>{n}</span>
						<small>{Math.round((scores[String(n)] ?? 0) * 100)}%</small>
					</button>
				))}
				{chanceNumber !== null && (
					<button className="ball ball-lg ball-chance" onClick={() => onSelect?.(chanceNumber, "chance")} title="Numéro chance suggéré">
						<span>{chanceNumber}</span>
						<small>chance</small>
					</button>
				)}
			</div>

			<p className="disclaimer">
				⚠️ Le Loto est un jeu de hasard pur : chaque tirage est indépendant des précédents.
				Ces statistiques n'offrent aucune garantie de gain.
			</p>
		</section>
	)
}
