// src/App.tsx
import React from "react";
import { DrawScopeProvider } from "./context/DrawScopeContext";
import ControlPanel from "./components/ControlPanel";
import DashboardSection from "./components/DashboardSection";
import HeatMap from "./components/HeatMap";
import Predictions from "./components/Predictions";
import FrequencyChart from "./components/FrequencyChart";
import GapsChart from "./components/GapsChart";
import CoMatrixHeatmap from "./components/CoMatrixHeatmap";
import RecentDraws from "./components/RecentDraws";
import TopNumbers from "./components/TopNumbers";
import ProbabilityBoard from "./components/ProbabilityBoard";

function App() {
	return (
		<DrawScopeProvider>
			<div className="min-h-screen bg-gray-900 text-white p-6 space-y-8">
				<h1 className="text-3xl font-bold mb-4">DrawScope Dashboard</h1>

				<DashboardSection title="Paramètres & Contrôles">
					<ControlPanel />
				</DashboardSection>

				<DashboardSection title="Prédictions & Heatmap">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<HeatMap />
						<Predictions />
					</div>
				</DashboardSection>

				<DashboardSection title="Statistiques avancées">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FrequencyChart />
						<GapsChart />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
						<CoMatrixHeatmap />
						<ProbabilityBoard />
					</div>
				</DashboardSection>

				<DashboardSection title="Historique & Top Numéros">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<RecentDraws />
						<TopNumbers />
					</div>
				</DashboardSection>
			</div>
		</DrawScopeProvider>
	);
}

export default App;
