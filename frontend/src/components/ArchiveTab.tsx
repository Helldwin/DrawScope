import { useEffect, useMemo, useState } from "react"
import HistoryEntryList from "./HistoryEntryList"
import NumberSearch from "./NumberSearch"
import { SkeletonHistoryList } from "./Skeleton"
import YearFilter from "./YearFilter"
import { availableYears, filterByNumbers, filterByYear, parseNumberList, sortEntriesByDateDesc, type HistoryEntry } from "../lib/history"

const PAGE_SIZE = 20

/** Shared browsing UI (year filter + search + pagination + detail rows) for a display-only archive: Super Loto, Grand Loto. */
export default function ArchiveTab({
	titleId,
	title,
	subtitle,
	entries
}: {
	titleId: string
	title: string
	subtitle: string
	entries: HistoryEntry[] | null
}) {
	const [year, setYear] = useState<number | null>(null)
	const [numberQuery, setNumberQuery] = useState("")
	const [page, setPage] = useState(1)

	const sorted = useMemo(() => sortEntriesByDateDesc(entries ?? []), [entries])
	const years = useMemo(() => availableYears(sorted), [sorted])
	const searchNumbers = useMemo(() => parseNumberList(numberQuery), [numberQuery])
	const filtered = useMemo(
		() => filterByNumbers(filterByYear(sorted, year), searchNumbers),
		[sorted, year, searchNumbers]
	)
	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	useEffect(() => setPage(1), [year, numberQuery])

	return (
		<section className="card" aria-labelledby={titleId}>
			<div className="card-header">
				<div>
					<h2 id={titleId}>{title}</h2>
					<p className="card-subtitle">
						{entries !== null &&
							`${filtered.length} tirages${year ? ` en ${year}` : ""}${searchNumbers.length > 0 ? ` contenant ${searchNumbers.join(", ")}` : ""}. `}
						{subtitle}
					</p>
				</div>
			</div>

			{entries !== null && (
				<div className="history-filters">
					{years.length > 0 && <YearFilter years={years} value={year} onChange={setYear} />}
					<NumberSearch value={numberQuery} onChange={setNumberQuery} id={`${titleId}-search`} />
				</div>
			)}

			<div className="history-list">
				{entries === null ? <SkeletonHistoryList /> : <HistoryEntryList entries={pageItems} />}
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
