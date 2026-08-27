import { useEffect, useMemo, useState } from "react"
import ArchiveTab from "./ArchiveTab"
import { BacktestIcon, BookmarkIcon, GiftIcon, HistoryIcon, OverviewIcon, RulesIcon, StarIcon, StatsIcon } from "./icons/TabIcons"
import NumberDetailPage from "./NumberDetailPage"
import TabNav, { type TabDef } from "./TabNav"
import BacktestTab from "./tabs/BacktestTab"
import HistoryTab from "./tabs/HistoryTab"
import MyGridsTab from "./tabs/MyGridsTab"
import OverviewTab from "./tabs/OverviewTab"
import RulesTab from "./tabs/RulesTab"
import StatsTab from "./tabs/StatsTab"
import { mergeHistoryEntries } from "../lib/history"
import {
	DEFAULT_WEIGHTS,
	computeChanceScores,
	computeCompositeScores,
	topPredictions,
	type NumberKind,
	type Weights
} from "../lib/stats"
import { useLazyJson } from "../lib/useLazyJson"
import type { Draw, DrawScopeData, LegacyDraw, SuperLotoArchive, WinnersByDate } from "../types"

const TABS: TabDef[] = [
	{ id: "apercu", label: "Aperçu", icon: <OverviewIcon /> },
	{ id: "historique", label: "Historique", icon: <HistoryIcon /> },
	{ id: "stats", label: "Statistiques", icon: <StatsIcon /> },
	{ id: "regles", label: "Règles & Grilles", icon: <RulesIcon /> },
	{ id: "mes-grilles", label: "Mes grilles", icon: <BookmarkIcon /> },
	{ id: "backtest", label: "Backtest", icon: <BacktestIcon /> },
	{ id: "super-loto", label: "Super Loto", icon: <StarIcon /> },
	{ id: "grand-loto", label: "Grand Loto", icon: <GiftIcon /> }
]

const TAB_LABELS: Record<string, string> = Object.fromEntries(TABS.map(t => [t.id, t.label]))

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

	// Lazily fetched the first time their tab is opened, then cached for the session.
	const preHistoryLoto = useLazyJson<LegacyDraw[]>("data/archive-loto-pre2008.json", tab === "historique")
	const winnersByDate = useLazyJson<WinnersByDate>("data/winners.json", tab === "historique")
	const superLotoArchive = useLazyJson<SuperLotoArchive>("data/archive-super-loto.json", tab === "super-loto")
	const grandLoto = useLazyJson<Draw[]>("data/archive-grand-loto.json", tab === "grand-loto")

	const superLotoEntries = useMemo(
		() => (superLotoArchive ? mergeHistoryEntries(superLotoArchive.modern, superLotoArchive.legacy) : null),
		[superLotoArchive]
	)
	const grandLotoEntries = useMemo(() => (grandLoto ? mergeHistoryEntries(grandLoto) : null), [grandLoto])

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
			<a className="skip-link" href="#main-content">Aller au contenu</a>

			<header className="page-header">
				<div>
					<h1>DrawScope</h1>
					<p className="tagline">Analyse statistique des tirages du Loto FDJ</p>
				</div>
				<div className="header-stats">
					<span className="stat-chip">{data.draws.length.toLocaleString("fr-FR")} tirages analysés</span>
					<span className="stat-chip">Mise à jour : {formattedUpdate}</span>
				</div>
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
			<p className="sr-only" role="status" aria-live="polite">
				{selected ? `Fiche numéro ${selected.number}` : `Onglet actif : ${TAB_LABELS[tab] ?? tab}`}
			</p>

			<main className="page-main" id="main-content">
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
					<div className="tab-content" key={tab}>
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
						{tab === "historique" && (
							<HistoryTab draws={data.draws} onSelect={onSelect} preHistoryLoto={preHistoryLoto} winnersByDate={winnersByDate} />
						)}
						{tab === "stats" && <StatsTab draws={data.draws} chanceScores={chanceScores} onSelect={onSelect} />}
						{tab === "regles" && <RulesTab draws={data.draws} scores={scores} chanceScores={chanceScores} onSelect={onSelect} />}
						{tab === "mes-grilles" && <MyGridsTab draws={data.draws} onSelect={onSelect} />}
						{tab === "backtest" && <BacktestTab draws={data.draws} scores={scores} chanceScores={chanceScores} />}
						{tab === "super-loto" && (
							<ArchiveTab
								titleId="super-loto-title"
								title="Super Loto"
								subtitle="Tirages exceptionnels à jackpot renforcé, en dehors du calendrier régulier — non inclus dans les statistiques ni le simulateur."
								entries={superLotoEntries}
							/>
						)}
						{tab === "grand-loto" && (
							<ArchiveTab
								titleId="grand-loto-title"
								title="Grand Loto"
								subtitle="Éditions spéciales de fin d'année (Loto de Noël, Grand Loto), non incluses dans les statistiques ni le simulateur."
								entries={grandLotoEntries}
							/>
						)}
					</div>
				)}
			</main>

			<footer className="page-footer">
				<p>Source : tirages officiels FDJ. Données recalculées chaque matin, vers 9h.</p>
				<p className="footer-meta">DrawScope — outil d'analyse statistique, sans garantie de gain.</p>
			</footer>
		</div>
	)
}
