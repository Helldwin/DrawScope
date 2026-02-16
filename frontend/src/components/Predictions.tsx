import { useEffect, useState } from "react";

const Predictions = () => {
	const [predictions, setPredictions] = useState<Record<string, number>>({});

	useEffect(() => {
		fetch("/predictions.json")  // <- chemin relatif depuis le site
			.then(res => {
				if (!res.ok) throw new Error("Failed to fetch predictions");
				return res.json();
			})
			.then(data => setPredictions(data))
			.catch(err => console.error(err));
	}, []);

	return (
		<div>
			<h2 className="text-xl font-bold mb-2">Prédictions</h2>
			<ul>
				{Object.entries(predictions).map(([num, score]) => (
					<li key={num}>
						{num} : <strong>{score}</strong>
					</li>
				))}
			</ul>
		</div>
	);
};

export default Predictions;
