import { useEffect, useMemo, useState } from "react"
import NumberDetailModal from "./NumberDetailModal"
import TabNav, { type TabDef } from "./TabNav"
import BacktestTab from "./tabs/BacktestTab"
import HistoryTab from "./tabs/HistoryTab"
import OverviewTab from "./tabs/OverviewTab"
import RulesTab from "./tabs/RulesTab"
import StatsTab from "./tabs/StatsTab"
import {
	DEFAULT_WEIGHTS,
	computeChanceScores,
	computeCompositeScores,
	topPredictions,
	type NumberKind,
	type Weights
} from "../lib/stats"
import type { DrawScopeData } from "../types"

const TABS: TabDef[] = [
	{ id: "apercu", label: "Aperçu" },
	{ id: "historique", label: "Historique" },
	{ id: "stats", label: "Statistiques" },
	{ id: "regles", label: "Règles & Grilles" },
	{ id: "backtest", label: "Backtest" }
]

function initialTab(): string {
	const hash = location.hash.slice(1)
	return TABS.some(t => t.id === hash) ? hash : "apercu"
}

export default function Dashboard({ data }: { data: DrawScopeData }) {
	const [tab, setTab] = useState(initialTab)
	const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
	const [selected, setSelected] = useState<{ number: number; kind: NumberKind } | null>(null)

	useEffect(() => {
		location.hash = tab
	}, [tab])

	const scores = useMemo(() => computeCompositeScores(data.draws, weights), [data.draws, weights])
	const chanceScores = useMemo(() => computeChanceScores(data.draws, weights), [data.draws, weights])
	const predictions = useMemo(() => topPredictions(scores, 5), [scores])
	const chancePrediction = useMemo(() => topPredictions(chanceScores, 1)[0] ?? null, [chanceScores])

	const onSelect = (number: number, kind: NumberKind) => setSelected({ number, kind })

	const formattedUpdate = data.last_update
		? new Date(data.last_update).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
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
					Chaque numéro reçoit un score composite entre 0 et 1, combinant sa <strong>fréquence</strong> d'apparition
					historique, son <strong>écart</strong> depuis le dernier tirage et une <strong>simulation Monte Carlo</strong>.
					Les poids de ces trois critères sont ajustables dans l'onglet Aperçu.
				</p>
			</details>

			<TabNav tabs={TABS} active={tab} onChange={setTab} />

			<main className="page-main">
				{tab === "apercu" && (
					<OverviewTab
						draws={data.draws}
						weights={weights}
						onWeightsChange={setWeights}
						scores={scores}
						predictions={predictions}
						chancePrediction={chancePrediction}
						onSelect={onSelect}
						onNavigateHistory={() => setTab("historique")}
					/>
				)}
				{tab === "historique" && <HistoryTab draws={data.draws} onSelect={onSelect} />}
				{tab === "stats" && <StatsTab draws={data.draws} chanceScores={chanceScores} onSelect={onSelect} />}
				{tab === "regles" && <RulesTab draws={data.draws} scores={scores} onSelect={onSelect} />}
				{tab === "backtest" && <BacktestTab draws={data.draws} />}
			</main>

			<footer className="page-footer">
				<p>Source : tirages officiels FDJ. Données recalculées chaque nuit.</p>
			</footer>

			{selected && (
				<NumberDetailModal
					number={selected.number}
					kind={selected.kind}
					draws={data.draws}
					scores={scores}
					chanceScores={chanceScores}
					onClose={() => setSelected(null)}
				/>
			)}
		</div>
	)
}
