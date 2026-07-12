import { useEffect, useMemo, useState } from "react"
import DrawList from "../DrawList"
import PeriodFilter from "../PeriodFilter"
import { drawsToCsv, downloadFile } from "../../lib/download"
import { filterByPeriod, sortByDate, type NumberKind, type Period } from "../../lib/stats"
import type { Draw } from "../../types"

const PAGE_SIZE = 20

export default function HistoryTab({ draws, onSelect }: { draws: Draw[]; onSelect: (n: number, kind: NumberKind) => void }) {
	const [period, setPeriod] = useState<Period>("all")
	const [page, setPage] = useState(1)

	const filtered = useMemo(() => filterByPeriod(draws, period), [draws, period])
	const sorted = useMemo(() => sortByDate(filtered).reverse(), [filtered])
	const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
	const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	useEffect(() => setPage(1), [period])

	const exportCsv = () => downloadFile(`drawscope-historique-${period}.csv`, drawsToCsv(filtered), "text/csv")

	return (
		<section className="card" aria-labelledby="history-title">
			<div className="card-header">
				<div>
					<h2 id="history-title">Historique complet</h2>
					<p className="card-subtitle">{filtered.length} tirages sur la période sélectionnée.</p>
				</div>
				<button className="btn-ghost" onClick={exportCsv}>Exporter en CSV</button>
			</div>

			<PeriodFilter value={period} onChange={setPeriod} />

			<div className="history-list">
				<DrawList draws={pageItems} onSelect={onSelect} />
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
