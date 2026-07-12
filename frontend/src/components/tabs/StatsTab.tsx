import { useMemo, useState } from "react"
import Heatmap from "../Heatmap"
import PeriodFilter from "../PeriodFilter"
import Histogram, { bucketize } from "../charts/Histogram"
import RatioBar from "../charts/RatioBar"
import {
	computeConsecutiveStats,
	computeHighLow,
	computeParity,
	computeSumDistribution,
	computeTopPairs,
	filterByPeriod,
	type NumberKind,
	type Period
} from "../../lib/stats"
import type { Draw } from "../../types"

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
	const sums = useMemo(() => computeSumDistribution(filtered), [filtered])
	const sumBuckets = useMemo(() => bucketize(sums, 10), [sums])
	const consecutive = useMemo(() => computeConsecutiveStats(filtered), [filtered])
	const pairs = useMemo(() => computeTopPairs(filtered, 10), [filtered])

	return (
		<>
			<section className="card" aria-labelledby="stats-title">
				<div className="card-header">
					<div>
						<h2 id="stats-title">Statistiques avancées</h2>
						<p className="card-subtitle">{filtered.length} tirages analysés sur la période sélectionnée.</p>
					</div>
				</div>
				<PeriodFilter value={period} onChange={setPeriod} />
			</section>

			<section className="card">
				<h3>Parité</h3>
				<RatioBar leftLabel="Pairs" leftValue={parity.even} rightLabel="Impairs" rightValue={parity.odd} />
			</section>

			<section className="card">
				<h3>Répartition 1-25 / 26-49</h3>
				<RatioBar leftLabel="1 à 25" leftValue={highLow.low} rightLabel="26 à 49" rightValue={highLow.high} />
			</section>

			<section className="card">
				<h3>Somme des 5 numéros tirés</h3>
				<p className="card-subtitle">Distribution de la somme totale par tirage.</p>
				<Histogram buckets={sumBuckets} />
			</section>

			<section className="card">
				<h3>Numéros consécutifs</h3>
				<p>
					<strong>{consecutive.withConsecutive}</strong> tirages sur {consecutive.total} contiennent au moins deux numéros
					qui se suivent ({Math.round(consecutive.ratio * 100)}%).
				</p>
			</section>

			<section className="card">
				<h3>Paires les plus fréquentes</h3>
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
