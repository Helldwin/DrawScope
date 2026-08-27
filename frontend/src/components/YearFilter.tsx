export default function YearFilter({
	years,
	value,
	onChange
}: {
	years: number[]
	value: number | null
	onChange: (year: number | null) => void
}) {
	return (
		<div className="rule-field year-filter">
			<label htmlFor="year-select">Année</label>
			<select
				id="year-select"
				value={value ?? "all"}
				onChange={e => onChange(e.target.value === "all" ? null : Number(e.target.value))}
			>
				<option value="all">Toutes les années ({years.length})</option>
				{years.map(y => (
					<option key={y} value={y}>{y}</option>
				))}
			</select>
		</div>
	)
}
