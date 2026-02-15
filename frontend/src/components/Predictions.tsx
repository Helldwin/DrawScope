export default function Predictions({ numbers }: { numbers: number[] }) {
	return (
		<div className="bg-gray-800 p-6 rounded-xl shadow-md">
			<h2 className="text-xl font-bold mb-4">🔮 Numéros à jouer (Prédictions)</h2>
			<div className="flex gap-4 justify-center">
				{numbers.map(n => (
					<div
						key={n}
						className="w-14 h-14 flex items-center justify-center
                       bg-gradient-to-r from-yellow-400 to-orange-500
                       text-gray-900 font-bold text-2xl rounded-full shadow-lg"
					>
						{n}
					</div>
				))}
			</div>
		</div>
	);
}
