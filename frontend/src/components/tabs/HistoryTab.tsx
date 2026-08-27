import { useEffect, useMemo, useState } from "react"
import DrawCalendar from "../DrawCalendar"
import HistoryEntryList from "../HistoryEntryList"
import NumberSearch from "../NumberSearch"
import YearFilter from "../YearFilter"
import { drawsToCsv, downloadFile } from "../../lib/download"
import {
	availableYears,
	filterByNumbers,
	filterByYear,
	mergeHistoryEntries,
	parseNumberList,
	sortEntriesByDateDesc,
	withWinners
} from "../../lib/history"
import type { NumberKind } from "../../lib/stats"
import type { Draw, LegacyDraw, WinnersByDate } from "../../types"

const PAGE_SIZE = 20

export default function HistoryTab({
	draws,
	onSelect,
	preHistoryLoto,
	winnersByDate
}: {
	draws: Draw[]
	onSelect: (n: number, kind: NumberKind) => void
	preHistoryLoto: LegacyDraw[] | null
	winnersByDate: WinnersByDate | null
}) {
	const [year, setYear] = useState<number | null>(null)
	const [numberQuery, setNumberQuery] = useState("")
	const [page, setPage] = useState(1)

	const allEntries = useMemo(
		() => sortEntriesByDateDesc(withWinners(mergeHistoryEntries(draws, preHistoryLoto ?? []), winnersByDate)),
		[draws, preHistoryLoto, winnersByDate]
	)

	const years = useMemo(() => availableYears(allEntries), [allEntries])
	const searchNumbers = useMemo(() => parseNumberList(numberQuery), [numberQuery])
	const filtered = useMemo(
		() => filterByNumbers(filterByYear(allEntries, year), searchNumbers),
		[allEntries, year, searchNumbers]
	)
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	useEffect(() => setPage(1), [year, numberQuery])

	const modernOnly: Draw[] = filtered.filter(e => e.format === "modern").map(({ format, ...draw }) => draw as Draw)

	const exportCsv = () => downloadFile(`drawscope-historique-${year ?? "tout"}.csv`, drawsToCsv(modernOnly), "text/csv")

	return (
		<section className="card" aria-labelledby="history-title">
			<div className="card-header">
				<div>
					<h2 id="history-title">Historique complet</h2>
					<p className="card-subtitle">
						{filtered.length} tirages{year ? ` en ${year}` : ""}
						{searchNumbers.length > 0 ? ` contenant ${searchNumbers.join(", ")}` : ""}, du Loto FDJ classique — de 1976 à
						aujourd'hui.
					</p>
				</div>
				<button className="btn-ghost" onClick={exportCsv} disabled={modernOnly.length === 0}>Exporter en CSV</button>
			</div>

			<div className="history-filters">
				<YearFilter years={years} value={year} onChange={setYear} />
				<NumberSearch value={numberQuery} onChange={setNumberQuery} />
			</div>
			{preHistoryLoto === null && (
				<p className="rule-hint">Chargement des archives 1976-2008…</p>
			)}
			{preHistoryLoto !== null && (
				<p className="rule-hint">
					Les tirages avant octobre 2008 utilisent l'ancien format (6 numéros + un complémentaire, au lieu de 5 + un numéro
					chance) — ils ne sont pas comptabilisés dans les statistiques et le simulateur de grille.
				</p>
			)}

			{year !== null && (
				<div className="section-block">
					<h3 className="section-title">Vue calendrier — {year}</h3>
					<DrawCalendar year={year} entries={filtered} />
				</div>
			)}

			<div className="history-list">
				<HistoryEntryList entries={pageItems} onSelect={onSelect} />
			</div>

			{totalPages > 1 && (
				<div className="pagination">
					<button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Précédent</button>
					<span className="pagination-status">Page {page} / {totalPages}</span>
					<button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant →</button>
				</div>
			)}
		</section>
	)
}
