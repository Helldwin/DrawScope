export default function NumberSearch({
	value,
	onChange,
	id = "number-search-input"
}: {
	value: string
	onChange: (v: string) => void
	id?: string
}) {
	return (
		<div className="rule-field number-search">
			<label htmlFor={id}>Rechercher des numéros (ex : 7, 23)</label>
			<input
				id={id}
				type="text"
				className="search-input"
				placeholder="ex : 7, 23"
				value={value}
				onChange={e => onChange(e.target.value)}
			/>
		</div>
	)
}
