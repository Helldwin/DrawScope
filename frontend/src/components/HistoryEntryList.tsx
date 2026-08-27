import { useState } from "react"
import type { HistoryEntry } from "../lib/history"
import type { NumberKind } from "../lib/stats"

function formatDate(date: string) {
	return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

function formatPayout(payout: number | null, currency: "eur" | "frf") {
	if (payout === null) return "—"
	const amount = payout.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
	return currency === "frf" ? `${amount} F` : `${amount} €`
}

export default function HistoryEntryList({
	entries,
	onSelect
}: {
	entries: HistoryEntry[]
	onSelect?: (n: number, kind: NumberKind) => void
}) {
	const [expandedKey, setExpandedKey] = useState<string | null>(null)

	if (entries.length === 0) {
		return <p className="empty-hint">Aucun tirage disponible.</p>
	}

	return (
		<ul className="draws-list">
			{entries.map((entry, i) => {
				const key = `${entry.format}-${entry.date}-${i}`
				const isOpen = expandedKey === key
				const hasDetail = !!entry.winners && entry.winners.length > 0
				const currency = entry.format === "legacy" ? entry.currency : "eur"

				return (
					<li key={key} className="draws-row-wrap">
						<div className="draws-row">
							<span className="draws-date">{formatDate(entry.date)}</span>
							<span className="draws-balls">
								{entry.numbers.map((n, j) =>
									entry.format === "modern" && onSelect ? (
										<button className="ball ball-sm" key={j} onClick={() => onSelect(n, "main")} title={`Numéro ${n}`}>
											{n}
										</button>
									) : (
										<span className="ball ball-sm ball-static" key={j}>{n}</span>
									)
								)}
								{entry.format === "modern" ? (
									onSelect ? (
										<button className="ball ball-sm ball-chance" onClick={() => onSelect(entry.chance, "chance")} title="Numéro chance">
											{entry.chance}
										</button>
									) : (
										<span className="ball ball-sm ball-chance ball-static">{entry.chance}</span>
									)
								) : (
									<span className="ball ball-sm ball-complementary ball-static" title="Numéro complémentaire">
										{entry.complementary}
									</span>
								)}
							</span>
							{hasDetail && (
								<button className="btn-ghost detail-toggle" onClick={() => setExpandedKey(isOpen ? null : key)} aria-expanded={isOpen}>
									{isOpen ? "Masquer" : "Détails"}
								</button>
							)}
						</div>

						{isOpen && hasDetail && (
							<div className="prize-tiers">
								<div className="prize-table-wrap">
									<table className="prize-table">
										<thead>
											<tr>
												<th>Rang</th>
												<th>Gagnants</th>
												<th>Gain / gagnant</th>
											</tr>
										</thead>
										<tbody>
											{entry.winners!.map(t => (
												<tr key={t.rank}>
													<td>{t.rank}</td>
													<td>{t.winners.toLocaleString("fr-FR")}</td>
													<td>{formatPayout(t.payout, currency)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</li>
				)
			})}
		</ul>
	)
}
