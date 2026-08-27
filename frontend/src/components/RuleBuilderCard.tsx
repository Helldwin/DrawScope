import { useMemo, useState } from "react"
import InfoTooltip from "./InfoTooltip"
import NumberPicker, { EMPTY_SELECTION, type NumberSelection } from "./NumberPicker"
import { DEFAULT_RULES, generateDistinctGrids, type ParityRule, type RuleConfig } from "../lib/rules"
import { addSavedGrid } from "../lib/myGrids"
import { computeEcartScores, computeFrequencyScores, type NumberKind } from "../lib/stats"
import type { Draw } from "../types"

const PARITY_OPTIONS: { id: ParityRule; label: string }[] = [
	{ id: "any", label: "Indifférent" },
	{ id: "balanced", label: "Équilibrée (2-3 ou 3-2)" },
	{ id: "mostlyEven", label: "Majorité pairs" },
	{ id: "mostlyOdd", label: "Majorité impairs" }
]

const LOW_HIGH_OPTIONS = [0, 1, 2, 3, 4, 5]

type SortBy = "composite" | "frequency" | "ecart" | "uniform"

const SORT_OPTIONS: { id: SortBy; label: string; description: string }[] = [
	{ id: "composite", label: "Score composite", description: "Pondération actuelle (réglable dans l'onglet Aperçu)." },
	{ id: "frequency", label: "Fréquence historique", description: "Privilégie les numéros les plus sortis." },
	{ id: "ecart", label: "Écart (retard)", description: "Privilégie les numéros les plus en retard." },
	{ id: "uniform", label: "Équitable (aucun biais)", description: "Tous les numéros ont la même chance d'être choisis." }
]

const MAX_GRIDS = 20

function uniformScores(poolSize = 49): Record<number, number> {
	const out: Record<number, number> = {}
	for (let i = 1; i <= poolSize; i++) out[i] = 1
	return out
}

export default function RuleBuilderCard({
	draws,
	scores,
	chanceScores,
	onSelect
}: {
	draws: Draw[]
	scores: Record<number, number>
	chanceScores: Record<number, number>
	onSelect: (n: number, kind: NumberKind) => void
}) {
	const [selection, setSelection] = useState<NumberSelection>(EMPTY_SELECTION)
	const [parity, setParity] = useState<ParityRule>(DEFAULT_RULES.parity)
	const [avoidConsecutive, setAvoidConsecutive] = useState(DEFAULT_RULES.avoidConsecutive)
	const [sumEnabled, setSumEnabled] = useState(false)
	const [sumMin, setSumMin] = useState(100)
	const [sumMax, setSumMax] = useState(150)
	const [rangeEnabled, setRangeEnabled] = useState(false)
	const [rangeMin, setRangeMin] = useState(1)
	const [rangeMax, setRangeMax] = useState(49)
	const [lowHighCount, setLowHighCount] = useState<number | null>(null)
	const [minScorePct, setMinScorePct] = useState(0)
	const [chanceMode, setChanceMode] = useState<"auto" | number>("auto")
	const [sortBy, setSortBy] = useState<SortBy>("composite")
	const [gridCount, setGridCount] = useState(1)

	const [results, setResults] = useState<number[][] | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set())

	const rankingScores = useMemo(() => {
		switch (sortBy) {
			case "frequency":
				return computeFrequencyScores(draws)
			case "ecart":
				return computeEcartScores(draws)
			case "uniform":
				return uniformScores()
			default:
				return scores
		}
	}, [sortBy, draws, scores])

	const generate = () => {
		const config: RuleConfig = {
			parity,
			avoidConsecutive,
			sumRange: sumEnabled ? [sumMin, sumMax] : null,
			includeNumbers: selection.include,
			preferNumbers: selection.prefer,
			excludeNumbers: selection.exclude,
			numberRange: rangeEnabled ? [rangeMin, rangeMax] : null,
			lowHighCount,
			minScore: minScorePct > 0 ? minScorePct / 100 : null
		}

		const count = Math.min(MAX_GRIDS, Math.max(1, gridCount || 1))
		const grids = generateDistinctGrids(rankingScores, config, count)
		setResults(grids)
		setSavedIndices(new Set())
		setError(grids.length === 0 ? "Aucune combinaison ne satisfait ces critères après plusieurs essais — essaie de les assouplir." : null)
	}

	const chanceNumber = chanceMode === "auto"
		? Object.entries(chanceScores).sort((a, b) => b[1] - a[1])[0]?.[0]
		: String(chanceMode)

	const saveGrid = (grid: number[], index: number) => {
		addSavedGrid(grid, chanceNumber ? Number(chanceNumber) : null)
		setSavedIndices(prev => new Set(prev).add(index))
	}

	return (
		<section className="card" aria-labelledby="rules-title">
			<div className="card-header">
				<div>
					<h2 id="rules-title">Simulateur de grille</h2>
					<p className="card-subtitle">Règle chaque paramètre manuellement pour générer une ou plusieurs grilles.</p>
				</div>
			</div>

			<div className="section-block">
				<h3 className="section-title">1. Numéros</h3>
				<NumberPicker value={selection} onChange={setSelection} />
			</div>

			<div className="section-block">
				<h3 className="section-title">2. Forme de la grille</h3>

				<div className="rule-grid-2col">
					<div className="rule-field">
						<label htmlFor="parity-select">Parité</label>
						<select id="parity-select" value={parity} onChange={e => setParity(e.target.value as ParityRule)}>
							{PARITY_OPTIONS.map(o => (
								<option key={o.id} value={o.id}>{o.label}</option>
							))}
						</select>
					</div>

					<div className="rule-field">
						<label htmlFor="lowhigh-select">Numéros entre 1 et 25 (sur les 5)</label>
						<select
							id="lowhigh-select"
							value={lowHighCount ?? "any"}
							onChange={e => setLowHighCount(e.target.value === "any" ? null : Number(e.target.value))}
						>
							<option value="any">Indifférent</option>
							{LOW_HIGH_OPTIONS.map(v => (
								<option key={v} value={v}>{v}</option>
							))}
						</select>
					</div>
				</div>

				<label className="rule-checkbox">
					<input type="checkbox" checked={avoidConsecutive} onChange={e => setAvoidConsecutive(e.target.checked)} />
					Éviter les numéros consécutifs
				</label>

				<label className="rule-checkbox">
					<input type="checkbox" checked={rangeEnabled} onChange={e => setRangeEnabled(e.target.checked)} />
					Restreindre la plage de numéros autorisés
				</label>
				{rangeEnabled && (
					<div className="rule-sum-range">
						<label>
							Min
							<input type="number" min={1} max={49} value={rangeMin} onChange={e => setRangeMin(Number(e.target.value))} />
						</label>
						<label>
							Max
							<input type="number" min={1} max={49} value={rangeMax} onChange={e => setRangeMax(Number(e.target.value))} />
						</label>
					</div>
				)}

				<label className="rule-checkbox">
					<input type="checkbox" checked={sumEnabled} onChange={e => setSumEnabled(e.target.checked)} />
					Restreindre la somme des 5 numéros
				</label>
				{sumEnabled && (
					<div className="rule-sum-range">
						<label>
							Min
							<input type="number" min={15} max={235} value={sumMin} onChange={e => setSumMin(Number(e.target.value))} />
						</label>
						<label>
							Max
							<input type="number" min={15} max={235} value={sumMax} onChange={e => setSumMax(Number(e.target.value))} />
						</label>
					</div>
				)}
			</div>

			<div className="section-block">
				<h3 className="section-title">3. Score &amp; tri</h3>

				<div className="rule-slider">
					<span className="weight-name">
						Score minimum par numéro
						<InfoTooltip text="Écarte les numéros dont le score composite est inférieur à ce seuil, avant même de tenter de construire une grille." />
					</span>
					<input type="range" min={0} max={90} step={5} value={minScorePct} onChange={e => setMinScorePct(Number(e.target.value))} />
					<span className="weight-value">{minScorePct}%</span>
				</div>

				<div className="rule-grid-2col">
					<div className="rule-field">
						<label htmlFor="chance-select">Numéro chance</label>
						<select id="chance-select" value={chanceMode} onChange={e => setChanceMode(e.target.value === "auto" ? "auto" : Number(e.target.value))}>
							<option value="auto">Auto (meilleur score)</option>
							{Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
								<option key={n} value={n}>{n}</option>
							))}
						</select>
					</div>

					<div className="rule-field">
						<label htmlFor="sortby-select">Classer les numéros par</label>
						<select id="sortby-select" value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}>
							{SORT_OPTIONS.map(o => (
								<option key={o.id} value={o.id}>{o.label}</option>
							))}
						</select>
					</div>
				</div>
				<span className="rule-hint">{SORT_OPTIONS.find(o => o.id === sortBy)?.description}</span>
			</div>

			<div className="section-block rule-generate">
				<h3 className="section-title">4. Génération</h3>
				<div className="rule-generate-row">
					<div className="rule-field rule-count-field">
						<label htmlFor="count-input">Nombre de grilles (max {MAX_GRIDS})</label>
						<input
							id="count-input"
							type="number"
							min={1}
							max={MAX_GRIDS}
							value={gridCount}
							onChange={e => setGridCount(Math.min(MAX_GRIDS, Math.max(1, Number(e.target.value))))}
						/>
					</div>
					<button className="btn btn-generate" onClick={generate}>Générer</button>
				</div>
			</div>

			{error && <p className="empty-hint">{error}</p>}

			{results && results.length > 0 && (
				<div className="rule-result">
					{results.map((grid, i) => (
						<div className="rule-result-item" key={i}>
							<div className="predictions-row rule-result-row">
								{grid.map((n, j) => (
									<button className="ball ball-lg" key={j} onClick={() => onSelect(n, "main")}>
										<span>{n}</span>
									</button>
								))}
								{chanceNumber && (
									<button className="ball ball-lg ball-chance" onClick={() => onSelect(Number(chanceNumber), "chance")}>
										<span>{chanceNumber}</span>
										<small>chance</small>
									</button>
								)}
							</div>
							<button className="btn-ghost save-grid-btn" onClick={() => saveGrid(grid, i)} disabled={savedIndices.has(i)}>
								{savedIndices.has(i) ? "★ Enregistrée" : "☆ Enregistrer"}
							</button>
						</div>
					))}
				</div>
			)}
		</section>
	)
}
