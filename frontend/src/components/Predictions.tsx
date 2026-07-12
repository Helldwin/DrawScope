export default function Predictions({ numbers, scores }: { numbers: number[]; scores: Record<string, number> }) {
	if (numbers.length === 0) {
		return <p className="empty-hint">Aucune prédiction disponible pour le moment.</p>
	}

	return (
		<section className="card" aria-labelledby="predictions-title">
			<div className="card-header">
				<div>
					<h2 id="predictions-title">🎯 Combinaison suggérée</h2>
					<p className="card-subtitle">Les 5 numéros au score composite le plus élevé.</p>
				</div>
			</div>

			<div className="predictions-row">
				{numbers.map((n, i) => (
					<div className="ball ball-lg" key={i}>
						<span>{n}</span>
						<small>{Math.round((scores[String(n)] ?? 0) * 100)}%</small>
					</div>
				))}
			</div>

			<p className="disclaimer">
				⚠️ Le Loto est un jeu de hasard pur : chaque tirage est indépendant des précédents.
				Ces statistiques n'offrent aucune garantie de gain.
			</p>
		</section>
	)
}
