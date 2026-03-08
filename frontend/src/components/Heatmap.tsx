export default function Heatmap({ scores }: any) {

	const getColor = (value: number) => {
		const red = Math.max(0, 255 - value * 2)
		const green = Math.min(255, value * 2)
		return `rgb(${red}, ${green}, 80)`
	}

	return (
		<div style={{ marginTop: 30 }}>
			<h2>Heatmap Probabilités</h2>
			<div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 8 }}>
				{Object.entries(scores).map(([num, val]: any) => (
					<div
						key={num}
						style={{
							padding: 12,
							textAlign: "center",
							background: getColor(val),
							borderRadius: 8
						}}
					>
						{num}
					</div>
				))}
			</div>
		</div>
	)
}
