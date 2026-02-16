export default function RecentDraws({ draws }: any) {
	const recent = draws.slice(-10).reverse();

	return (
		<div className="bg-gray-800 p-6 rounded-xl shadow-md">
			<h2 className="text-xl font-bold mb-4">
				📅 Derniers tirages
			</h2>

			<div className="space-y-2">
				{recent.map((draw: number[], i: number) => (
					<div
						key={i}
						className="flex gap-2 bg-gray-700 p-2 rounded-lg"
					>
						{draw.map((n: number) => (
							<div
								key={n}
								className="w-10 h-10 flex items-center justify-center
                           bg-indigo-500 rounded-full font-bold"
							>
								{n}
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
