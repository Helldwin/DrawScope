export type NumberTier = "include" | "prefer" | "exclude"

export interface NumberSelection {
	include: number[]
	prefer: number[]
	exclude: number[]
}

export const EMPTY_SELECTION: NumberSelection = { include: [], prefer: [], exclude: [] }

const TIER_LABELS: Record<NumberTier, string> = {
	include: "obligatoire",
	prefer: "privilégié",
	exclude: "exclu"
}

function stateOf(selection: NumberSelection, n: number): NumberTier | null {
	if (selection.include.includes(n)) return "include"
	if (selection.prefer.includes(n)) return "prefer"
	if (selection.exclude.includes(n)) return "exclude"
	return null
}

function withState(selection: NumberSelection, n: number, state: NumberTier | null): NumberSelection {
	return {
		include: state === "include" ? [...selection.include, n] : selection.include.filter(x => x !== n),
		prefer: state === "prefer" ? [...selection.prefer, n] : selection.prefer.filter(x => x !== n),
		exclude: state === "exclude" ? [...selection.exclude, n] : selection.exclude.filter(x => x !== n)
	}
}

/**
 * Click-to-cycle number grid: neutre → obligatoire → privilégié → exclu → neutre.
 * Replaces free-text comma lists so the three tiers stay mutually exclusive by construction.
 */
export default function NumberPicker({
	value,
	onChange,
	poolSize = 49,
	maxInclude = 5
}: {
	value: NumberSelection
	onChange: (v: NumberSelection) => void
	poolSize?: number
	maxInclude?: number
}) {
	const cycle = (n: number) => {
		const current = stateOf(value, n)
		let next: NumberTier | null
		if (current === null) next = value.include.length >= maxInclude ? "prefer" : "include"
		else if (current === "include") next = "prefer"
		else if (current === "prefer") next = "exclude"
		else next = null
		onChange(withState(value, n, next))
	}

	const hasAny = value.include.length + value.prefer.length + value.exclude.length > 0

	return (
		<div className="number-picker">
			<div className="number-picker-toolbar">
				<div className="number-picker-legend">
					<span className="picker-chip picker-chip-include">Obligatoire · {value.include.length}/{maxInclude}</span>
					<span className="picker-chip picker-chip-prefer">Privilégié · {value.prefer.length}</span>
					<span className="picker-chip picker-chip-exclude">Exclu · {value.exclude.length}</span>
				</div>
				{hasAny && (
					<button type="button" className="btn-ghost" onClick={() => onChange(EMPTY_SELECTION)}>
						Tout effacer
					</button>
				)}
			</div>

			<div className="number-picker-grid" role="group" aria-label="Sélection des numéros">
				{Array.from({ length: poolSize }, (_, i) => i + 1).map(n => {
					const state = stateOf(value, n)
					return (
						<button
							key={n}
							type="button"
							className={state ? `number-picker-cell state-${state}` : "number-picker-cell"}
							onClick={() => cycle(n)}
							title={state ? `${n} — ${TIER_LABELS[state]} (clique pour changer)` : `${n} — clique pour le marquer obligatoire`}
						>
							{n}
						</button>
					)
				})}
			</div>

			<p className="rule-hint">Clique un numéro pour le passer obligatoire, puis privilégié, puis exclu, puis neutre à nouveau.</p>
		</div>
	)
}
