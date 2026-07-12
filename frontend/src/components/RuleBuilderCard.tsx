import { useState } from "react"
import { generateGrid, type ParityRule, type RuleConfig } from "../lib/rules"

const PARITY_OPTIONS: { id: ParityRule; label: string }[] = [
	{ id: "any", label: "Indifférent" },
	{ id: "balanced", label: "Équilibrée (2-3 ou 3-2)" },
	{ id: "mostlyEven", label: "Majorité pairs" },
	{ id: "mostlyOdd", label: "Majorité impairs" }
]

export default function RuleBuilderCard({ scores, onSelect }: { scores: Record<number, number>; onSelect: (n: number) => void }) {
	const [parity, setParity] = useState<ParityRule>("any")
	const [avoidConsecutive, setAvoidConsecutive] = useState(false)
	const [sumEnabled, setSumEnabled] = useState(false)
	const [sumMin, setSumMin] = useState(100)
	const [sumMax, setSumMax] = useState(150)
	const [result, setResult] = useState<number[] | null>(null)
	const [notFound, setNotFound] = useState(false)

	const generate = () => {
		const config: RuleConfig = {
			parity,
			avoidConsecutive,
			sumRange: sumEnabled ? [sumMin, sumMax] : null
		}
		const grid = generateGrid(scores, config)
		setResult(grid)
		setNotFound(!grid)
	}

	return (
		<section className="card" aria-labelledby="rules-title">
			<div className="card-header">
				<div>
					<h2 id="rules-title">Constructeur de règles</h2>
					<p className="card-subtitle">Combine des critères pour générer une grille qui les respecte.</p>
				</div>
			</div>

			<div className="rule-field">
				<label htmlFor="parity-select">Parité</label>
				<select id="parity-select" value={parity} onChange={e => setParity(e.target.value as ParityRule)}>
					{PARITY_OPTIONS.map(o => (
						<option key={o.id} value={o.id}>{o.label}</option>
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

			<button className="btn" onClick={generate}>Générer une grille</button>

			{result && (
				<div className="predictions-row rule-result">
					{result.map((n, i) => (
						<button className="ball ball-lg" key={i} onClick={() => onSelect(n)}>
							<span>{n}</span>
						</button>
					))}
				</div>
			)}

			{notFound && (
				<p className="empty-hint">Aucune combinaison ne satisfait ces critères après plusieurs essais — essaie de les assouplir.</p>
			)}
		</section>
	)
}
