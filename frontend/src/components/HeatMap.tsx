// src/components/Heatmap.tsx
import { useEffect, useState } from "react";


interface Predictions {
	[num: string]: number;
}

const Heatmap = () => {
	const [predictions, setPredictions] = useState<Predictions>({});

	useEffect(() => {
		fetch("/predictions.json") // ou "/drawscope/predictions.json" si GitHub Pages repo
			.then(res => {
				if (!res.ok) throw new Error("Failed to fetch predictions.json");
				return res.json();
			})
			.then(data => setPredictions(data))
			.catch(err => console.error(err));
	}, []);

	// Normaliser les scores pour la couleur
	const scores = Object.values(predictions);
	const max = Math.max(...scores, 1); // éviter div par zéro
	const min = Math.min(...scores, 0);

	const getColor = (score: number) => {
		const ratio = (score - min) / (max - min); // 0 → min, 1 → max
		const green = Math.round(255 * ratio);
		const red = 255 - green;
		return `rgb(${red}, ${green}, 0)`; // rouge → vert
	};

	// Trier les numéros pour un affichage clair
	const sortedNumbers = Object.keys(predictions)
		.map(n => parseInt(n))
		.sort((a, b) => a - b);

	return (
		<div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg">
			<h2 className="text-xl font-bold mb-4">Heatmap des prédictions</h2>
			<div className="grid grid-cols-7 gap-2">
				{sortedNumbers.map(num => (
					<div
						key={num}
						title={`Score: ${predictions[num]}`} // tooltip au survol
						style={{
							backgroundColor: getColor(predictions[num]),
							color: "#fff",
							padding: "8px",
							textAlign: "center",
							borderRadius: "4px",
							fontWeight: "bold",
							cursor: "default"
						}}
					>
						{num}
					</div>
				))}
			</div>
			<div className="mt-4 flex justify-between text-sm">
				<span>Rouge = faible score</span>
				<span>Vert = score élevé</span>
			</div>
		</div>
	);
};

export default Heatmap;
