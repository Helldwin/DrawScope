import Heatmap from "./Heatmap"
import Predictions from "./Predictions"

export default function Dashboard({ data }: any) {
	return (
		<div style={{ background: "#0f172a", color: "white", minHeight: "100vh", padding: 40 }}>
			<h1>DrawScope V5</h1>
			<Heatmap scores={data.scores} />
			<Predictions numbers={data.predictions} />
		</div>
	)
}
