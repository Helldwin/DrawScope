import Heatmap from "./Heatmap"
import Predictions from "./Predictions"
import RecentDraws from "./RecentDraws"
import type { DrawScopeData } from "../types"

export default function Dashboard({ data }: { data: DrawScopeData }) {
	const formattedUpdate = data.last_update
		? new Date(data.last_update).toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "long",
			year: "numeric"
		})
		: "inconnue"

	return (
		<div className="page">
			<header className="page-header">
				<div>
					<h1>DrawScope</h1>
					<p className="tagline">Analyse statistique des tirages du Loto FDJ</p>
				</div>
				<span className="update-badge">Mise à jour : {formattedUpdate}</span>
			</header>

			<details className="methodology">
				<summary>Comment le score est-il calculé ?</summary>
				<p>
					Chaque numéro reçoit un score composite entre 0 et 1, combinant sa
					<strong> fréquence</strong> d'apparition historique (40%), son
					<strong> écart</strong> depuis le dernier tirage (30%) et une
					<strong> simulation Monte Carlo</strong> sur 20 000 tirages (30%).
				</p>
			</details>

			<main className="page-main">
				<Predictions numbers={data.predictions} scores={data.scores} />
				<Heatmap scores={data.scores} />

				<section className="card" aria-labelledby="recent-title">
					<div className="card-header">
						<div>
							<h2 id="recent-title">Derniers tirages</h2>
							<p className="card-subtitle">Historique des 5 tirages les plus récents.</p>
						</div>
					</div>
					<RecentDraws draws={data.recent_draws} />
				</section>
			</main>

			<footer className="page-footer">
				<p>Source : tirages officiels FDJ. Données recalculées chaque nuit.</p>
			</footer>
		</div>
	)
}
