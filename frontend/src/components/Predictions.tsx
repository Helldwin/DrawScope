export default function Predictions({ numbers }: any) {
	return (
		<div style={{ marginTop: 40 }}>
			<h2>🎯 Combinaison suggérée</h2>
			<div style={{ display: "flex", gap: 12 }}>
				{numbers.map((n: number, i: number) => (
					<div key={i} style={{
						width: 50,
						height: 50,
						borderRadius: "50%",
						background: "#2563eb",
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						fontWeight: "bold"
					}}>
						{n}
					</div>
				))}
			</div>
		</div>
	)
}
