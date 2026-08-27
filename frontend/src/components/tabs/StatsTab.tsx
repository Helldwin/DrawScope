import { useMemo, useState } from "react"
import Heatmap from "../Heatmap"
import InfoTooltip from "../InfoTooltip"
import PeriodFilter from "../PeriodFilter"
import Histogram, { bucketize } from "../charts/Histogram"
import RatioBar from "../charts/RatioBar"
import {
	computeConsecutiveStats,
	computeCurrentEcartLeader,
	computeDecadeDistribution,
	computeFrequencyExtremes,
	computeHighLow,
	computeHistoricalEcartRecord,
	computeParity,
	computeSumDistribution,
	computeSumStats,
	computeTopPairs,
	computeTopTriplets,
	filterByPeriod,
	type NumberKind,
	type Period
} from "../../lib/stats"
import type { Draw } from "../../types"

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function StatsTab({
	draws,
	chanceScores,
	onSelect
}: {
	draws: Draw[]
	chanceScores: Record<number, number>
	onSelect: (n: number, kind: NumberKind) => void
}) {
	const [period, setPeriod] = useState<Period>("all")

	const filtered = useMemo(() => filterByPeriod(draws, period), [draws, period])
	const parity = useMemo(() => computeParity(filtered), [filtered])
	const highLow = useMemo(() => computeHighLow(filtered), [filtered])
	const decades = useMemo(() => computeDecadeDistribution(filtered), [filtered])
	const sums = useMemo(() => computeSumDistribution(filtered), [filtered])
	const sumBuckets = useMemo(() => bucketize(sums, 10), [sums])
	const sumStats = useMemo(() => computeSumStats(filtered), [filtered])
	const consecutive = useMemo(() => computeConsecutiveStats(filtered), [filtered])
	const pairs = useMemo(() => computeTopPairs(filtered, 10), [filtered])
	const triplets = useMemo(() => computeTopTriplets(filtered, 8), [filtered])
	const extremes = useMemo(() => computeFrequencyExtremes(filtered, 5), [filtered])
	// Écart ("retard") is a whole-history concept — a number absent from a short filtered
	// window isn't "overdue", it just wasn't drawn in that window. Always compute it against
	// the full dataset, independently of the period filter, to avoid nonsense like every
	// unseen number reporting a 9999-day sentinel gap.
	const currentEcartLeader = useMemo(() => computeCurrentEcartLeader(draws), [draws])
	const ecartRecord = useMemo(() => computeHistoricalEcartRecord(draws), [draws])

	return (
		<>
			<section className="card" aria-labelledby="stats-title">
				<div className="card-header">
					<div>
						<h2 id="stats-title">Statistiques avancées</h2>
						<p className="card-subtitle">Vue d'ensemble et tendances sur la période sélectionnée.</p>
					</div>
				</div>
				<PeriodFilter value={period} onChange={setPeriod} />

				<div className="kpi-grid">
					<div className="modal-stat">
						<span className="modal-stat-value">{filtered.length}</span>
						<span className="modal-stat-label">tirages analysés</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{extremes.top[0]?.number ?? "—"}</span>
						<span className="modal-stat-label">plus fréquent ({extremes.top[0]?.count ?? 0}×)</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{currentEcartLeader?.number ?? "—"}</span>
						<span className="modal-stat-label">
							plus en retard ({currentEcartLeader?.days ?? 0} j)
							<InfoTooltip text="Calculé sur tout l'historique — l'écart d'un numéro ne dépend pas du filtre de période ci-dessus." />
						</span>
					</div>
					<div className="modal-stat">
						<span className="modal-stat-value">{sumStats.average}</span>
						<span className="modal-stat-label">somme moyenne / tirage</span>
					</div>
				</div>
			</section>

			<section className="card" aria-labelledby="shape-title">
				<div className="card-header">
					<div>
						<h2 id="shape-title">Forme d'un tirage</h2>
						<p className="card-subtitle">Comment se répartissent les 5 numéros, sur la période sélectionnée.</p>
					</div>
				</div>

				<div className="section-block">
					<h3 className="section-title">
						Parité
						<InfoTooltip text="Sur les 5 numéros d'un tirage, combien sont pairs et combien sont impairs, cumulé sur la période sélectionnée." />
					</h3>
					<RatioBar leftLabel="Pairs" leftValue={parity.even} rightLabel="Impairs" rightValue={parity.odd} />
				</div>

				<div className="section-block">
					<h3 className="section-title">
						Répartition 1-25 / 26-49
						<InfoTooltip text="La plage des 49 numéros coupée en deux moitiés égales : combien de numéros tirés viennent de chaque moitié." />
					</h3>
					<RatioBar leftLabel="1 à 25" leftValue={highLow.low} rightLabel="26 à 49" rightValue={highLow.high} />
				</div>

				<div className="section-block">
					<h3 className="section-title">
						Répartition par dizaine
						<InfoTooltip text="Les 49 numéros regroupés par tranche de dix (1-9, 10-19, …), pour voir si une tranche sort plus souvent que les autres." />
					</h3>
					<Histogram buckets={decades} />
				</div>

				<div className="section-block">
					<h3 className="section-title">
						Numéros consécutifs
						<InfoTooltip text="Deux numéros « qui se suivent » dans un tirage, par exemple 12 et 13. Utile pour juger si une grille avec des numéros consécutifs est courante ou non." />
					</h3>
					<p>
						<strong>{consecutive.withConsecutive}</strong> tirages sur {consecutive.total} contiennent au moins deux numéros
						qui se suivent ({Math.round(consecutive.ratio * 100)}%).
					</p>
				</div>

				<div className="section-block">
					<h3 className="section-title">Somme des 5 numéros tirés</h3>
					<p className="card-subtitle">Min {sumStats.min} · Moyenne {sumStats.average} · Max {sumStats.max}</p>
					<Histogram buckets={sumBuckets} />
				</div>
			</section>

			<section className="card" aria-labelledby="extremes-title">
				<div className="card-header">
					<div>
						<h2 id="extremes-title">Numéros extrêmes</h2>
						<p className="card-subtitle">Les numéros qui sortent le plus... et le moins, sur la période sélectionnée.</p>
					</div>
				</div>

				{extremes.top.length === 0 ? (
					<p className="empty-hint">Pas assez de données sur cette période.</p>
				) : (
					<div className="extremes-columns">
						<div>
							<h3 className="section-title">Top {extremes.top.length} les plus fréquents</h3>
							<ul className="extremes-list">
								{extremes.top.map(e => (
									<li className="extremes-row" key={`top-${e.number}`}>
										<button className="ball ball-sm" onClick={() => onSelect(e.number, "main")}>{e.number}</button>
										<span>{e.count} sorties</span>
									</li>
								))}
							</ul>
						</div>
						<div>
							<h3 className="section-title">Top {extremes.bottom.length} les plus rares</h3>
							<ul className="extremes-list">
								{extremes.bottom.map(e => (
									<li className="extremes-row" key={`bottom-${e.number}`}>
										<button className="ball ball-sm" onClick={() => onSelect(e.number, "main")}>{e.number}</button>
										<span>{e.count} sorties</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{ecartRecord && (
					<p className="extremes-record">
						🏆 Record d'écart sur l'historique complet : le numéro <strong>{ecartRecord.number}</strong> est resté{" "}
						<strong>{ecartRecord.days} jours</strong> sans sortir
						{ecartRecord.endDate ? `, jusqu'au ${formatDate(ecartRecord.endDate)}.` : " — et c'est toujours en cours."}
					</p>
				)}
			</section>

			<section className="card" aria-labelledby="patterns-title">
				<div className="card-header">
					<div>
						<h2 id="patterns-title">Régularités entre numéros</h2>
						<p className="card-subtitle">Les combinaisons de 2 et 3 numéros les plus souvent sorties ensemble.</p>
					</div>
				</div>

				<div className="section-block">
					<h3 className="section-title">Paires les plus fréquentes</h3>
					{pairs.length === 0 ? (
						<p className="empty-hint">Pas assez de données sur cette période.</p>
					) : (
						<ul className="pairs-list">
							{pairs.map(p => (
								<li key={`${p.a}-${p.b}`} className="pairs-row">
									<span className="draws-balls">
										<button className="ball ball-sm" onClick={() => onSelect(p.a, "main")}>{p.a}</button>
										<button className="ball ball-sm" onClick={() => onSelect(p.b, "main")}>{p.b}</button>
									</span>
									<span className="pairs-count">{p.count} fois ensemble</span>
								</li>
							))}
						</ul>
					)}
				</div>

				<div className="section-block">
					<h3 className="section-title">Triplettes les plus fréquentes</h3>
					{triplets.length === 0 ? (
						<p className="empty-hint">Pas assez de données sur cette période.</p>
					) : (
						<ul className="pairs-list">
							{triplets.map(t => (
								<li key={`${t.a}-${t.b}-${t.c}`} className="pairs-row">
									<span className="draws-balls">
										<button className="ball ball-sm" onClick={() => onSelect(t.a, "main")}>{t.a}</button>
										<button className="ball ball-sm" onClick={() => onSelect(t.b, "main")}>{t.b}</button>
										<button className="ball ball-sm" onClick={() => onSelect(t.c, "main")}>{t.c}</button>
									</span>
									<span className="pairs-count">{t.count} fois ensemble</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</section>

			<Heatmap
				scores={chanceScores as Record<string, number>}
				onSelect={onSelect}
				kind="chance"
				title="Numéro chance"
				subtitle="Score composite pour chacun des 10 numéros chance."
				showSearch={false}
			/>
		</>
	)
}
