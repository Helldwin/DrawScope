import { useCallback, useEffect, useState } from "react"
import Dashboard from "./components/Dashboard"
import Loader from "./components/Loader"
import type { DrawScopeData } from "./types"

type Status = "loading" | "error" | "ready"

export default function App() {
	const [data, setData] = useState<DrawScopeData | null>(null)
	const [status, setStatus] = useState<Status>("loading")

	const loadData = useCallback(() => {
		setStatus("loading")
		fetch("data/data.json", { cache: "no-store" })
			.then(res => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				return res.json()
			})
			.then((json: DrawScopeData) => {
				setData(json)
				setStatus("ready")
			})
			.catch(() => {
				setStatus("error")
			})
	}, [])

	useEffect(() => {
		loadData()
	}, [loadData])

	if (status === "loading") return <Loader />

	if (status === "error" || !data) {
		return (
			<div className="state-screen">
				<div className="state-card">
					<span className="state-icon" aria-hidden="true">⚠️</span>
					<h1>Données indisponibles</h1>
					<p>Impossible de charger les statistiques pour le moment. Elles sont mises à jour chaque matin.</p>
					<button className="btn" onClick={loadData}>Réessayer</button>
				</div>
			</div>
		)
	}

	return <Dashboard data={data} />
}
