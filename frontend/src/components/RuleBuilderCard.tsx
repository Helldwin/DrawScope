import { useState } from "react"
import { DEFAULT_RULES, generateDistinctGrids, type ParityRule, type RuleConfig } from "../lib/rules"
import type { NumberKind } from "../lib/stats"

const PARITY_OPTIONS: { id: ParityRule; label: string }[] = [
	{ id: "any", label: "Indifférent" },
	{ id: "balanced", label: "Équilibrée (2-3 ou 3-2)" },
	{ id: "mostlyEven", label: "Majorité pairs" },
	{ id: "mostlyOdd", label: "Majorité impairs" }
]

const LOW_HIGH_OPTIONS = [null, 0, 1, 2, 3, 4, 5]

function parseNumberList(input: string): number[] {
	return input
		.split(",")
		.map(s => Number(s.trim()))
		.filter(n => Number.isInteger(n) && n >= 1 && n <= 49)
}

export default function RuleBuilderCard({
	scores,
	chanceScores,
	onSelect
}: {
	scores: Record<number, number>
	chanceScores: Record<number, number>
	onSelect: (n: number, kind: NumberKind) => void
}) {
	const [parity, setParity] = useState<ParityRule>(DEFAULT_RULES.parity)
	const [avoidConsecutive, setAvoidConsecutive] = useState(DEFAULT_RULES.avoidConsecutive)
	const [sumEnabled, setSumEnabled] = useState(false)
	const [sumMin, setSumMin] = useState(100)
	const [sumMax, setSumMax] = useState(150)
	const [includeInput, setIncludeInput] = useState("")
	const [excludeInput, setExcludeInput] = useState("")
	const [rangeEnabled, setRangeEnabled] = useState(false)
	const [rangeMin, setRangeMin] = useState(1)
	const [rangeMax, setRangeMax] = useState(49)
	const [lowHighCount, setLowHighCount] = useState<number | null>(null)
	const [minScorePct, setMinScorePct] = useState(0)
	const [chanceMode, setChanceMode] = useState<"auto" | number>("auto")
	const [gridCount, setGridCount] = useState(1)

	const [results, setResults] = useState<number[][] | null>(null)
	const [error, setError] = useState<string | null>(null)

	const generate = () => {
		const includeNumbers = parseNumberList(includeInput)
		const excludeNumbers = parseNumberList(excludeInput)

		if (includeNumbers.length > 5) {
			setError("Maximum 5 numéros à inclure.")
			setResults(null)
			return
		}
		if (includeNumbers.some(n => excludeNumbers.includes(n))) {
			setError("Un numéro ne peut pas être à la fois inclus et exclu.")
			setResults(null)
			return
		}

		const config: RuleConfig = {
			parity,
			avoidConsecutive,
			sumRange: sumEnabled ? [sumMin, sumMax] : null,
			includeNumbers,
			excludeNumbers,
			numberRange: rangeEnabled ? [rangeMin, rangeMax] : null,
			lowHighCount,
			minScore: minScorePct > 0 ? minScorePct / 100 : null
		}

		const grids = generateDistinctGrids(scores, config, gridCount)
		setResults(grids)
		setError(grids.length === 0 ? "Aucune combinaison ne satisfait ces critères après plusieurs essais — essaie de les assouplir." : null)
	}

	const chanceNumber = chanceMode === "auto"
		? Object.entries(chanceScores).sort((a, b) => b[1] - a[1])[0]?.[0]
		: String(chanceMode)

	return (
		<section className="card" aria-labelledby="rules-title">
			<div className="card-header">
				<div>
					<h2 id="rules-title">Simulateur de grille</h2>
					<p className="card-subtitle">Règle chaque paramètre manuellement pour générer une ou plusieurs grilles.</p>
				</div>
			</div>

			<div className="rule-field">
				<label htmlFor="include-input">Numéros à inclure obligatoirement (max 5, séparés par une virgule)</label>
				<input id="include-input" type="text" placeholder="ex : 7, 23" value={includeInput} onChange={e => setIncludeInput(e.target.value)} />
			</div>

			<div className="rule-field">
				<label htmlFor="exclude-input">Numéros à exclure</label>
				<input id="exclude-input" type="text" placeholder="ex : 13, 44" value={excludeInput} onChange={e => setExcludeInput(e.target.value)} />
			</div>

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
					{LOW_HIGH_OPTIONS.filter((v): v is number => v !== null).map(v => (
						<option key={v} value={v}>{v}</option>
					))}
				</select>
			</div>

			<label className="rule-checkbox">
				<input type="checkbox" checked={avoidConsecutive} onChange={e => setAvoidConsecutive(e.target.checked)} />
				Éviter les numéros consécutifs
			</label>

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

			<div className="rule-slider">
				<span className="weight-name">Score minimum par numéro</span>
				<input type="range" min={0} max={90} step={5} value={minScorePct} onChange={e => setMinScorePct(Number(e.target.value))} />
				<span className="weight-value">{minScorePct}%</span>
			</div>

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
				<label htmlFor="count-select">Nombre de grilles à générer</label>
				<select id="count-select" value={gridCount} onChange={e => setGridCount(Number(e.target.value))}>
					<option value={1}>1</option>
					<option value={3}>3</option>
					<option value={5}>5</option>
					<option value={10}>10</option>
				</select>
			</div>

			<button className="btn" onClick={generate}>Générer</button>

			{error && <p className="empty-hint">{error}</p>}

			{results && results.length > 0 && (
				<div className="rule-result">
					{results.map((grid, i) => (
						<div className="predictions-row rule-result-row" key={i}>
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
					))}
				</div>
			)}
		</section>
	)
}
