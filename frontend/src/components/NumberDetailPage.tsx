import { useState } from "react"
import { computeFullNumberProfile, type NumberKind, type Weights } from "../lib/stats"
import type { Draw } from "../types"

export default function NumberDetailPage({
	number,
	kind,
	draws,
	weights,
	onSelect,
	onBack
}: {
	number: number
	kind: NumberKind
	draws: Draw[]
	weights: Weights
	onSelect: (n: number, kind: NumberKind) => void
	onBack: () => void
}) {
	const [copied, setCopied] = useState(false)
	const profile = computeFullNumberProfile(draws, number, kind, weights)
	const isChance = kind === "chance"

	const share = async () => {
		const text = `DrawScope — Numéro ${isChance ? "chance " : ""}${number} : ${profile.frequency} apparitions, ${profile.ecart.current} jours d'écart, score ${Math.round(profile.scoreBreakdown.composite * 100)}%.`
		if (navigator.share) {
			try {
				await navigator.share({ text })
				return
			} catch {
				// fall through to clipboard
			}
		}
		await navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="number-page">
			<button className="btn-ghost back-btn" onClick={onBack}>← Retour</button>

			<section className="card number-page-header">
				<span className={isChance ? "ball ball-xl ball-chance" : "ball ball-xl"}>
					<span>{number}</span>
				</span>
				<div className="number-page-heading">
					<h2>{isChance ? "Numéro chance " : "Numéro "}{number}</h2>
					<p className="card-subtitle">
						Rang {profile.rank} / {profile.totalInPool} — {profile.parity === "pair" ? "pair" : "impair"}
						{profile.category && ` — ${profile.category === "bas" ? "1 à 25" : "26 à 49"}`}
					</p>
				</div>
				<button className="btn-ghost" onClick={share}>{copied ? "Copié !" : "Partager"}</button>
			</section>

			<section className="card">
				<h3>Score composite : {Math.round(profile.scoreBreakdown.composite * 100)}%</h3>
				<p className="card-subtitle">Décomposition selon la pondération actuelle (réglable dans l'onglet Aperçu).</p>
				<div className="score-breakdown">
					<div className="score-breakdown-row">
						<span>Fréquence</span>
						<div className="score-breakdown-track"><div className="score-breakdown-fill" style={{ width: `${profile.scoreBreakdown.frequency * 100}%` }} /></div>
						<span>{Math.round(profile.scoreBreakdown.frequency * 100)}%</span>
					</div>
					<div className="score-breakdown-row">
						<span>Écart</span>
						<div className="score-breakdown-track"><div className="score-breakdown-fill" style={{ width: `${profile.scoreBreakdown.ecart * 100}%` }} /></div>
						<span>{Math.round(profile.scoreBreakdown.ecart * 100)}%</span>
					</div>
					<div className="score-breakdown-row">
						<span>Monte Carlo</span>
						<div className="score-breakdown-track"><div className="score-breakdown-fill" style={{ width: `${profile.scoreBreakdown.montecarlo * 100}%` }} /></div>
						<span>{Math.round(profile.scoreBreakdown.montecarlo * 100)}%</span>
					</div>
				</div>
			</section>

			<section className="card">
				<h3>Chiffres clés</h3>
				<div className="modal-stats number-page-stats">
					<div className="modal-stat">
						<span className="modal-stat-value">{profile.frequency}</span>
						<span className="modal-stat-label">apparitions ({Math.round(profile.frequencyPct * 100)}%)</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{profile.ecart.current}</span>
						<span className="modal-stat-label">jours d'écart actuel</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{profile.ecart.record}</span>
						<span className="modal-stat-label">record d'écart</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{profile.ecart.average}</span>
						<span className="modal-stat-label">écart moyen (jours)</span>
					</div>
				</div>
			</section>

			{!isChance && profile.topPairs.length > 0 && (
				<section className="card">
					<h3>Numéros les plus associés</h3>
					<p className="card-subtitle">Numéros qui sortent le plus souvent avec le {number}.</p>
					<div className="draws-balls">
						{profile.topPairs.map(p => (
							<button className="ball ball-sm" key={p.b} onClick={() => onSelect(p.b, "main")} title={`${p.count} fois ensemble`}>
								{p.b}
							</button>
						))}
					</div>
				</section>
			)}

			<section className="card">
				<h3>{isChance ? "Numéros principaux associés" : "Numéros chance associés"}</h3>
				<p className="card-subtitle">
					{isChance
						? "Numéros principaux les plus fréquents lors des tirages avec ce numéro chance."
						: "Numéros chance les plus fréquents lors des tirages avec ce numéro."}
				</p>
				{profile.coOccurring.length === 0 ? (
					<p className="empty-hint">Pas assez de données.</p>
				) : (
					<div className="draws-balls">
						{profile.coOccurring.map(c => (
							<button
								className={isChance ? "ball ball-sm" : "ball ball-sm ball-chance"}
								key={c.value}
								onClick={() => onSelect(c.value, isChance ? "main" : "chance")}
								title={`${c.count} fois ensemble`}
							>
								{c.value}
							</button>
						))}
					</div>
				)}
			</section>

			<section className="card">
				<h3>Historique complet des apparitions ({profile.appearances.length})</h3>
				{profile.appearances.length === 0 ? (
					<p className="empty-hint">Ce numéro n'est jamais sorti sur l'historique disponible.</p>
				) : (
					<ul className="number-page-appearances">
						{profile.appearances.map(date => (
							<li key={date}>
								{new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
							</li>
						))}
					</ul>
				)}
			</section>
		</div>
	)
}
