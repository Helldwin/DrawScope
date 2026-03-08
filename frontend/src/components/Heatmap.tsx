export default function Heatmap({ data }: any) {

	const entries = Object.entries(data)

	return (
		<div>
			<h2>Heatmap</h2>
			<div className="grid">
				{entries.map(([n, v]: any) => {
					const color = `rgb(${255 - v * 5},${v * 5},0)`
					return (
						<div key={n} className="cell" style={{ background: color }}>
							{n}
						</div>
					)
				})}
			</div>
		</div>
	)
}
