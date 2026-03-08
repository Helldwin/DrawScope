import { useEffect, useState } from "react"
import Dashboard from "./components/Dashboard"
import Loader from "./components/Loader"

export default function App() {
	const [data, setData] = useState<any>(null)
	const [error, setError] = useState(false)

	useEffect(() => {
		fetch("data/data.json", { cache: "no-store" })
			.then(res => {
				if (!res.ok) throw new Error()
				return res.json()
			})
			.then(setData)
			.catch(() => {
				console.warn("Fallback mode")
				setData({
					scores: {},
					predictions: [],
					recent_draws: []
				})
			})
	}, [])


	if (error) {
		return (
			<div style={{ padding: 40, color: "white", background: "#111", minHeight: "100vh" }}>
				<h1>⚠️ Données indisponibles</h1>
				<p>Les statistiques seront mises à jour prochainement.</p>
			</div>
		)
	}

	if (!data) return <Loader />

	return <Dashboard data={data} />
}
