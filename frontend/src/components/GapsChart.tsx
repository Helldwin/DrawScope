import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function GapsChart({ stats }: any) {
	const data = Object.entries(stats).map(([num, s]: any) => ({
		number: num,
		avg: s.avg_gap
	}));

	return (
		<div className="bg-white shadow-md p-6 rounded-xl h-[300px]">
			<h2 className="text-2xl font-bold mb-4 text-gray-700">
				📊 Écarts Moyens
			</h2>
			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data}>
					<XAxis dataKey="number" tick={{ fill: "#333" }} />
					<YAxis tick={{ fill: "#333" }} />
					<Tooltip />
					<Bar dataKey="avg" fill="#3b82f6" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
