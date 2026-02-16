export default function ProbabilityBoard({ scores }: any) {
	const sorted = Object.entries(scores)
		.map(([n, s]: any) => ({ n: parseInt(n), score: s }))
		.sort((a, b) => b.score - a.score);

	const top = sorted.slice(0, 10);

	const color = (score: number) => {
		if (score > 70) return "bg-green-500";
		if (score > 40) return "bg-yellow-500";
		return "bg-red-500";
	};

	return (
		<div className="bg-gray-800 p-6 rounded-xl shadow-md">
			<h2 className="text-xl font-bold mb-4">
				📈 Score de probabilité de sortie
			</h2>

			<div className="grid grid-cols-5 gap-4">
				{top.map(n => (
					<div
						key={n.n}
						className={`${color(n.score)} p-3 rounded-lg text-center`}
					>
						<div className="text-2xl font-bold">{n.n}</div>
						<div className="text-sm">{n.score}%</div>
					</div>
				))}
			</div>

			<p className="text-xs text-gray-400 mt-4">
				Score basé sur fréquence, retard et tendances récentes.
				Ce n’est pas une prédiction garantie.
			</p>
		</div>
	);
}
