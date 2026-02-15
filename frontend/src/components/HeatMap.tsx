import { Draw } from "../utils/stats";
import { useMemo } from "react";

type Props = {
	draws: Draw[];
};

export default function Heatmap({ draws }: Props) {
	// Calculer la fréquence des numéros
	const frequencies = useMemo(() => {
		const freq: Record<number, number> = {};
		for (let i = 1; i <= 49; i++) freq[i] = 0;
		draws.forEach(draw => draw.forEach(n => freq[n]++));
		return freq;
	}, [draws]);

	// Trouver le max pour normaliser la couleur
	const max = Math.max(...Object.values(frequencies));

	return (
		<div className="grid grid-cols-7 gap-2 p-4 bg-zinc-900 rounded-xl">
			{Array.from({ length: 49 }, (_, i) => i + 1).map(num => {
				const count = frequencies[num];
				const intensity = Math.round((count / max) * 255);
				const bgColor = `rgb(0, ${intensity}, ${255 - intensity})`;

				return (
					<div
						key={num}
						className="flex items-center justify-center text-white font-bold rounded-lg h-12 w-12 transition-all duration-500"
						style={{ backgroundColor: bgColor }}
					>
						{num}
					</div>
				);
			})}
		</div>
	);
}
