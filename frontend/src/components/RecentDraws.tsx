import { Draw } from "../utils/stats";
import { motion } from "framer-motion";

type Props = { draws: Draw[] };

export default function RecentDraws({ draws }: Props) {
	const last5 = draws.slice(-5).reverse();
	return (
		<div className="mt-6">
			<h2 className="text-lg mb-4 text-white">5 derniers tirages</h2>
			<div className="flex gap-3">
				{last5.map((draw, i) => (
					<motion.div
						key={i}
						className="flex gap-1 bg-zinc-800 p-2 rounded-lg"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: i * 0.1 }}
					>
						{draw.map(num => (
							<div
								key={num}
								className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full"
							>
								{num}
							</div>
						))}
					</motion.div>
				))}
			</div>
		</div>
	);
}
