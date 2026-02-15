import { motion } from "framer-motion";

export default function HeatmapAnimated({ draws }: { draws: number[][] }) {
	const recent = draws.slice(-50).reverse();

	return (
		<div className="bg-gray-800 p-6 rounded-xl shadow-md overflow-x-auto">
			<h2 className="text-xl font-bold mb-4">🔥 Heatmap derniers tirages</h2>
			<div className="grid grid-cols-5 gap-3">
				{recent.map((draw, i) =>
					draw.map((num, j) => (
						<motion.div
							key={`${i}-${j}`}
							className="w-12 h-12 flex items-center justify-center rounded-full font-bold text-gray-100"
							style={{
								backgroundColor: `hsl(${(num / 49) * 360}, 70%, 30%)`
							}}
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							transition={{ delay: j * 0.03 }}
						>
							{num}
						</motion.div>
					))
				)}
			</div>
		</div>
	);
}
