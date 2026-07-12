import { PERIODS, type Period } from "../lib/stats"

export default function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
	return (
		<div className="segmented" role="group" aria-label="Filtrer par période">
			{PERIODS.map(p => (
				<button
					key={p.id}
					className={value === p.id ? "segmented-btn active" : "segmented-btn"}
					onClick={() => onChange(p.id)}
					aria-pressed={value === p.id}
				>
					{p.label}
				</button>
			))}
		</div>
	)
}
