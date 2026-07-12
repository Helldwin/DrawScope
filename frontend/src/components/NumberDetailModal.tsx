import { useEffect } from "react"
import { chancePick, computeNumberProfile, mainPick, type NumberKind } from "../lib/stats"
import type { Draw } from "../types"

export default function NumberDetailModal({
	number,
	kind,
	draws,
	scores,
	chanceScores,
	onClose
}: {
	number: number
	kind: NumberKind
	draws: Draw[]
	scores: Record<number, number>
	chanceScores: Record<number, number>
	onClose: () => void
}) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
		window.addEventListener("keydown", onKey)
		return () => window.removeEventListener("keydown", onKey)
	}, [onClose])

	const isChance = kind === "chance"
	const profile = computeNumberProfile(draws, number, isChance ? chanceScores : scores, isChance ? chancePick : mainPick)

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={e => e.stopPropagation()}>
				<div className="modal-header">
					<span className={isChance ? "ball ball-lg ball-chance" : "ball ball-lg"}>
						<span>{number}</span>
					</span>
					<div>
						<h2 id="modal-title">{isChance ? "Numéro chance " : "Numéro "}{number}</h2>
						<p className="card-subtitle">Fiche détaillée</p>
					</div>
					<button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
				</div>

				<div className="modal-stats">
					<div className="modal-stat">
						<span className="modal-stat-value">{profile.frequency}</span>
						<span className="modal-stat-label">apparitions</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{profile.ecartDays}</span>
						<span className="modal-stat-label">jours d'écart</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{Math.round(profile.score * 100)}%</span>
						<span className="modal-stat-label">score composite</span>
					</div>
				</div>

				<h3 className="modal-section-title">Dernières apparitions</h3>
				{profile.appearances.length === 0 ? (
					<p className="empty-hint">Ce numéro n'est jamais sorti sur la période disponible.</p>
				) : (
					<ul className="modal-appearances">
						{profile.appearances.map(date => (
							<li key={date}>
								{new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}
