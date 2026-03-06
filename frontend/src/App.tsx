import { useEffect, useState } from "react"

import Heatmap from "./components/Heatmap.tsx"
import Predictions from "./components/Predictions.tsx"
import MonteCarlo from "./components/MonteCarlo.tsx"
import RecentDraws from "./components/RecentDraws.tsx"

import dataJson from './data/data.json'

function App() {

	const [data, setData] = useState(dataJson)

	if (!data) return <div>Loading...</div>

	return (

		<div className="container">

			<h1>DrawScope V4</h1>

			<p>Last update {data.last_update}</p>

			<Heatmap data={data.scores} />

			<Predictions data={data.scores} />

			<MonteCarlo data={data.montecarlo} />

			<RecentDraws data={data.recent_draws} />

		</div>

	)

}

export default App
