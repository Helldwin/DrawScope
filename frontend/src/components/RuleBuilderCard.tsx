import { useMemo, useState } from "react"
import InfoTooltip from "./InfoTooltip"
import NumberPicker, { EMPTY_SELECTION, type NumberSelection } from "./NumberPicker"
import { DEFAULT_RULES, generateAllValidGrids, generateDistinctGrids, type ParityRule, type RuleConfig } from "../lib/rules"
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

type Mode = "deterministic" | "random"

const MODE_OPTIONS: { id: Mode; label: string; description: string }[] = [
	{ id: "deterministic", label: "Déterministe (meilleur score)", description: "Toujours les mêmes grilles pour les mêmes réglages, classées par score et réparties sur des numéros différents." },
	{ id: "random", label: "Aléatoire pondéré (variété)", description: "Tirage pondéré par le score — change à chaque génération, pour varier les combinaisons." }
]

const MAX_GRIDS = 20
const KEEP_COUNT = 200

function uniformScores(poolSize = 49): Record<number, number> {
	const out: Record<number, number> = {}
	for (let i = 1; i <= poolSize; i++) out[i] = 1
	return out
}

function gridKey(grid: number[]): string {
	return grid.join(",")
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
	const [preferMinCount, setPreferMinCount] = useState<number | null>(null)
	const [minScorePct, setMinScorePct] = useState(0)
	const [chanceMode, setChanceMode] = useState<"auto" | number>("auto")
	const [sortBy, setSortBy] = useState<SortBy>("composite")
	const [gridCount, setGridCount] = useState(1)
	const [mode, setMode] = useState<Mode>("deterministic")

	const [running, setRunning] = useState(false)
	const [results, setResults] = useState<number[][] | null>(null)
	const [totalValid, setTotalValid] = useState<number | null>(null)
	const [visibleCount, setVisibleCount] = useState(1)
	const [error, setError] = useState<string | null>(null)
	const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
	const [eliminatedKeys, setEliminatedKeys] = useState<Set<string>>(new Set())

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

	const maxPreferMinCount = Math.min(5, selection.prefer.length)

	const generate = () => {
		const config: RuleConfig = {
			parity,
			avoidConsecutive,
			sumRange: sumEnabled ? [sumMin, sumMax] : null,
			includeNumbers: selection.include,
			preferNumbers: selection.prefer,
			preferMinCount: maxPreferMinCount > 0 ? preferMinCount : null,
			excludeNumbers: selection.exclude,
			numberRange: rangeEnabled ? [rangeMin, rangeMax] : null,
			lowHighCount,
			minScore: minScorePct > 0 ? minScorePct / 100 : null
		}
		const count = Math.min(MAX_GRIDS, Math.max(1, gridCount || 1))

		setRunning(true)
		setSavedKeys(new Set())
		setEliminatedKeys(new Set())
		// Deferred so the "Calcul en cours…" state actually paints before the
		// (synchronous, CPU-bound) search runs — the deterministic mode can scan
		// the full combination space.
		setTimeout(() => {
			if (mode === "deterministic") {
				const { grids, totalValid: valid } = generateAllValidGrids(rankingScores, config, 49, 5, KEEP_COUNT)
				setResults(grids.map(g => g.combination))
				setTotalValid(valid)
				setVisibleCount(Math.min(count, grids.length))
				setError(grids.length === 0 ? "Aucune combinaison ne satisfait ces critères — essaie de les assouplir." : null)
			} else {
				const grids = generateDistinctGrids(rankingScores, config, count)
				setResults(grids)
				setTotalValid(null)
				setVisibleCount(grids.length)
				setError(grids.length === 0 ? "Aucune combinaison ne satisfait ces critères après plusieurs essais — essaie de les assouplir." : null)
			}
			setRunning(false)
		}, 30)
	}

	const chanceNumber = chanceMode === "auto"
		? Object.entries(chanceScores).sort((a, b) => b[1] - a[1])[0]?.[0]
		: String(chanceMode)

	const saveGrid = (grid: number[]) => {
		addSavedGrid(grid, chanceNumber ? Number(chanceNumber) : null)
		setSavedKeys(prev => new Set(prev).add(gridKey(grid)))
	}

	const eliminateGrid = (grid: number[]) => {
		setEliminatedKeys(prev => new Set(prev).add(gridKey(grid)))
	}

	const remainingResults = useMemo(
		() => (results ?? []).filter(g => !eliminatedKeys.has(gridKey(g))),
		[results, eliminatedKeys]
	)
	const visibleResults = remainingResults.slice(0, visibleCount)
	const canExpand = mode === "deterministic" && remainingResults.length > visibleCount

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

				{selection.prefer.length > 0 && (
					<div className="rule-field">
						<label htmlFor="prefer-min-select">
							Au moins combien de numéros privilégiés dans chaque grille ? (optionnel)
							<InfoTooltip text="Force chaque grille à contenir au minimum ce nombre de numéros marqués « privilégié », plutôt que de simplement leur donner un bonus de score." />
						</label>
						<select
							id="prefer-min-select"
							value={preferMinCount ?? "any"}
							onChange={e => setPreferMinCount(e.target.value === "any" ? null : Number(e.target.value))}
						>
							<option value="any">Indifférent (juste un bonus de score)</option>
							{Array.from({ length: maxPreferMinCount }, (_, i) => i + 1).map(v => (
								<option key={v} value={v}>{v}</option>
							))}
						</select>
					</div>
				)}
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

				<div className="rule-field">
					<label htmlFor="mode-select">
						Mode de génération
						<InfoTooltip text="Déterministe : reproductible, prend les meilleures grilles possibles par score, réparties sur des numéros différents. Aléatoire pondéré : tirage au sort biaisé par le score, différent à chaque génération." />
					</label>
					<select id="mode-select" value={mode} onChange={e => setMode(e.target.value as Mode)}>
						{MODE_OPTIONS.map(o => (
							<option key={o.id} value={o.id}>{o.label}</option>
						))}
					</select>
					<span className="rule-hint">{MODE_OPTIONS.find(o => o.id === mode)?.description}</span>
				</div>

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
					<button className="btn btn-generate" onClick={generate} disabled={running}>
						{running ? "Calcul en cours…" : "Générer"}
					</button>
				</div>
			</div>

			{error && <p className="empty-hint">{error}</p>}

			{visibleResults.length > 0 && (
				<div className="rule-result">
					{visibleResults.map(grid => {
						const key = gridKey(grid)
						return (
							<div className="rule-result-item" key={key}>
								<div className="predictions-row rule-result-row">
									{grid.map((n, j) => (
										<button className="ball ball-lg" key={j} onClick={() => onSelect(n, "main")}>
											<span>{n}</span>
											{sortBy !== "uniform" && <small>{Math.round((rankingScores[n] ?? 0) * 100)}%</small>}
										</button>
									))}
									{chanceNumber && (
										<button className="ball ball-lg ball-chance" onClick={() => onSelect(Number(chanceNumber), "chance")}>
											<span>{chanceNumber}</span>
											<small>chance</small>
										</button>
									)}
								</div>
								<div className="rule-result-actions">
									<button className="btn-ghost save-grid-btn" onClick={() => saveGrid(grid)} disabled={savedKeys.has(key)}>
										{savedKeys.has(key) ? "★ Enregistrée" : "☆ Enregistrer"}
									</button>
									<button className="btn-ghost eliminate-grid-btn" onClick={() => eliminateGrid(grid)} title="Retirer cette grille des résultats">
										✕ Éliminer
									</button>
								</div>
							</div>
						)
					})}
				</div>
			)}

			{mode === "deterministic" && totalValid !== null && remainingResults.length > 0 && (
				<div className="rule-expand">
					<button className="btn-ghost" onClick={() => setVisibleCount(canExpand ? remainingResults.length : Math.min(gridCount, remainingResults.length))}>
						{visibleResults.length} grille{visibleResults.length > 1 ? "s" : ""} affichée{visibleResults.length > 1 ? "s" : ""} sur {totalValid.toLocaleString("fr-FR")}
						{" "}combinaison{totalValid > 1 ? "s" : ""} valide{totalValid > 1 ? "s" : ""} — {canExpand ? "tout afficher" : "réduire"}
					</button>
					{totalValid > (results?.length ?? 0) && (
						<span className="rule-hint">(les {results?.length} meilleures, réparties sur des numéros différents, conservées sur {totalValid.toLocaleString("fr-FR")} au total)</span>
					)}
				</div>
			)}
		</section>
	)
}
