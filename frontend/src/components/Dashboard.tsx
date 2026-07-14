import { useEffect, useMemo, useState } from "react"
import NumberDetailPage from "./NumberDetailPage"
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

type Selected = { number: number; kind: NumberKind } | null

function parseHash(): { tab: string; selected: Selected } {
	const hash = location.hash.slice(1)
	const numberMatch = hash.match(/^numero-(main|chance)-(\d+)$/)
	if (numberMatch) {
		return { tab: "apercu", selected: { kind: numberMatch[1] as NumberKind, number: Number(numberMatch[2]) } }
	}
	return { tab: TABS.some(t => t.id === hash) ? hash : "apercu", selected: null }
}

export default function Dashboard({ data }: { data: DrawScopeData }) {
	const initial = parseHash()
	const [tab, setTab] = useState(initial.tab)
	const [selected, setSelected] = useState<Selected>(initial.selected)
	const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)

	useEffect(() => {
		location.hash = selected ? `numero-${selected.kind}-${selected.number}` : tab
	}, [tab, selected])

	useEffect(() => {
		const onHashChange = () => {
			const parsed = parseHash()
			setTab(parsed.tab)
			setSelected(parsed.selected)
		}
		window.addEventListener("hashchange", onHashChange)
		return () => window.removeEventListener("hashchange", onHashChange)
	}, [])

	const scores = useMemo(() => computeCompositeScores(data.draws, weights), [data.draws, weights])
	const chanceScores = useMemo(() => computeChanceScores(data.draws, weights), [data.draws, weights])
	const predictions = useMemo(() => topPredictions(scores, 5), [scores])
	const chancePrediction = useMemo(() => topPredictions(chanceScores, 1)[0] ?? null, [chanceScores])

	const onSelect = (number: number, kind: NumberKind) => setSelected({ number, kind })
	const onTabChange = (id: string) => {
		setSelected(null)
		setTab(id)
	}

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

			<TabNav tabs={TABS} active={tab} onChange={onTabChange} />

			<main className="page-main">
				{selected ? (
					<NumberDetailPage
						number={selected.number}
						kind={selected.kind}
						draws={data.draws}
						weights={weights}
						onSelect={onSelect}
						onBack={() => setSelected(null)}
					/>
				) : (
					<>
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
						{tab === "regles" && <RulesTab draws={data.draws} scores={scores} chanceScores={chanceScores} onSelect={onSelect} />}
						{tab === "backtest" && <BacktestTab draws={data.draws} />}
					</>
				)}
			</main>

			<footer className="page-footer">
				<p>Source : tirages officiels FDJ. Données recalculées chaque nuit.</p>
			</footer>
		</div>
	)
}
