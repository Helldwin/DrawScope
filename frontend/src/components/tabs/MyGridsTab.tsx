import { useMemo, useState } from "react"
import { addSavedGrid, loadSavedGrids, removeSavedGrid, type SavedGrid } from "../../lib/myGrids"
import { evaluateGridAgainstHistory, sortByDate, type NumberKind } from "../../lib/stats"
import type { Draw } from "../../types"

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function MyGridsTab({
	draws,
	onSelect
}: {
	draws: Draw[]
	onSelect: (n: number, kind: NumberKind) => void
}) {
	const [grids, setGrids] = useState<SavedGrid[]>(() => loadSavedGrids())
	const [inputs, setInputs] = useState(["", "", "", "", ""])
	const [chanceInput, setChanceInput] = useState("")
	const [label, setLabel] = useState("")
	const [error, setError] = useState<string | null>(null)

	const latestDraw = useMemo(() => (draws.length ? sortByDate(draws)[draws.length - 1] : null), [draws])

	const updateInput = (i: number, value: string) => {
		const next = [...inputs]
		next[i] = value.replace(/[^0-9]/g, "")
		setInputs(next)
	}

	const add = () => {
		const numbers = inputs.map(Number)
		if (numbers.some(n => !n || n < 1 || n > 49)) {
			setError("Entre 5 numéros valides, entre 1 et 49.")
			return
		}
		if (new Set(numbers).size !== 5) {
			setError("Les 5 numéros doivent être différents.")
			return
		}
		const chance = chanceInput ? Number(chanceInput) : null
		if (chance !== null && (chance < 1 || chance > 10)) {
			setError("Le numéro chance doit être entre 1 et 10 (ou vide).")
			return
		}
		setError(null)
		addSavedGrid(numbers, chance, label.trim())
		setGrids(loadSavedGrids())
		setInputs(["", "", "", "", ""])
		setChanceInput("")
		setLabel("")
	}

	const remove = (id: string) => {
		removeSavedGrid(id)
		setGrids(loadSavedGrids())
	}

	return (
		<section className="card" aria-labelledby="my-grids-title">
			<div className="card-header">
				<div>
					<h2 id="my-grids-title">Mes grilles</h2>
					<p className="card-subtitle">
						Enregistre les grilles que tu joues pour suivre leurs résultats — tout reste dans ton navigateur, rien
						n'est envoyé où que ce soit.
					</p>
				</div>
			</div>

			<div className="grid-checker-inputs">
				{inputs.map((v, i) => (
					<input
						key={i}
						type="text"
						inputMode="numeric"
						maxLength={2}
						className="grid-checker-input"
						value={v}
						onChange={e => updateInput(i, e.target.value)}
						aria-label={`Numéro ${i + 1}`}
					/>
				))}
				<input
					type="text"
					inputMode="numeric"
					maxLength={2}
					className="grid-checker-input grid-checker-chance"
					value={chanceInput}
					onChange={e => setChanceInput(e.target.value.replace(/[^0-9]/g, ""))}
					aria-label="Numéro chance (optionnel)"
					placeholder="chance"
				/>
			</div>

			<div className="rule-field my-grids-label-field">
				<label htmlFor="grid-label-input">Nom (optionnel)</label>
				<input
					id="grid-label-input"
					type="text"
					placeholder="ex : Grille du vendredi"
					value={label}
					onChange={e => setLabel(e.target.value)}
					maxLength={40}
				/>
			</div>

			<button className="btn" onClick={add}>Enregistrer cette grille</button>
			{error && <p className="empty-hint">{error}</p>}

			{grids.length === 0 ? (
				<p className="empty-hint">Aucune grille enregistrée pour l'instant.</p>
			) : (
				<div className="my-grids-list">
					{grids.map(grid => {
						const latestMatch = latestDraw ? grid.numbers.filter(n => latestDraw.numbers.includes(n)).length : null
						const chanceMatch = !!latestDraw && grid.chance !== null && grid.chance === latestDraw.chance
						const evalHistory = evaluateGridAgainstHistory(draws, grid.numbers)

						return (
							<div className="my-grid-card" key={grid.id}>
								<div className="my-grid-header">
									<div>
										{grid.label && <strong>{grid.label}</strong>}
										<span className="card-subtitle">Enregistrée le {formatDate(grid.savedAt.slice(0, 10))}</span>
									</div>
									<button className="btn-ghost" onClick={() => remove(grid.id)}>Supprimer</button>
								</div>

								<div className="draws-balls">
									{grid.numbers.map(n => (
										<button className="ball ball-sm" key={n} onClick={() => onSelect(n, "main")} title={`Numéro ${n}`}>{n}</button>
									))}
									{grid.chance !== null && (
										<button className="ball ball-sm ball-chance" onClick={() => onSelect(grid.chance!, "chance")} title="Numéro chance">
											{grid.chance}
										</button>
									)}
								</div>

								{latestDraw && latestMatch !== null && (
									<p className="card-subtitle my-grid-status">
										Dernier tirage ({formatDate(latestDraw.date)}) :{" "}
										<strong>{latestMatch} bon{latestMatch !== 1 ? "s" : ""} numéro{latestMatch !== 1 ? "s" : ""}</strong>
										{chanceMatch ? " + numéro chance !" : ""}
									</p>
								)}

								<p className="card-subtitle">
									{evalHistory.exactMatches > 0
										? `Cette combinaison exacte est déjà sortie ${evalHistory.exactMatches} fois.`
										: `Meilleur résultat historique : ${evalHistory.bestMatches} numéro(s) commun(s)${evalHistory.bestMatchDate ? ` le ${formatDate(evalHistory.bestMatchDate)}` : ""}.`}
								</p>
							</div>
						)
					})}
				</div>
			)}
		</section>
	)
}
