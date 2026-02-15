export default function TopNumbers({ stats }: any) {
	// On classe les numéros par fréquence (count)
	const numbers = Object.entries(stats)
		.map(([num, s]: any) => ({ num: parseInt(num), count: s.count }))
		.sort((a, b) => b.count - a.count);

	const hot = numbers.slice(0, 5);
	const cold = numbers.slice(-5);

	return (
		<div className="bg-gray-800 p-6 rounded-xl shadow-md space-y-4">
			<h2 className="text-xl font-bold">🔥 Numéros chauds & ❄️ Numéros froids</h2>
			<div className="flex justify-around">
				<div className="space-y-2 text-center">
					<div className="font-semibold mb-1">Chauds</div>
					<div className="flex gap-3 justify-center">
						{hot.map(n => (
							<div
								key={n.num}
								className="w-12 h-12 flex items-center justify-center
                           bg-red-500 text-white font-bold rounded-full"
							>
								{n.num}
							</div>
						))}
					</div>
				</div>
				<div className="space-y-2 text-center">
					<div className="font-semibold mb-1">Froids</div>
					<div className="flex gap-3 justify-center">
						{cold.map(n => (
							<div
								key={n.num}
								className="w-12 h-12 flex items-center justify-center
                           bg-blue-500 text-white font-bold rounded-full"
							>
								{n.num}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
