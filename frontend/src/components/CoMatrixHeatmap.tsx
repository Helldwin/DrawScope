export default function CoMatrixHeatmap({ matrix }: { matrix: number[][] }) {
	return (
		<div className="bg-white shadow-md p-6 rounded-xl overflow-auto">
			<h2 className="text-2xl font-bold mb-4 text-gray-700">
				🌡️ Matrice de Co-Occurrences
			</h2>
			<div className="grid grid-cols-[repeat(49,24px)] gap-[2px]">
				{matrix.flatMap((row, i) =>
					row.map((value, j) => (
						<div
							key={`${i}-${j}`}
							className="w-6 h-6 rounded-sm"
							style={{
								backgroundColor: `rgba(59, 130, 246, ${Math.min(value / 10, 1)})`
							}}
						/>
					))
				)}
			</div>
		</div>
	);
}
