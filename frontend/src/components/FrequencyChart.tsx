import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";

type Props = {
	data: { number: number; count: number }[];
};

export default function FrequencyChart({ data }: Props) {
	return (
		<div className="bg-zinc-900 p-6 rounded-xl h-[400px]">
			<h2 className="text-lg mb-4">Fréquence des numéros</h2>

			<ResponsiveContainer width="100%" height="100%">
				<BarChart data={data}>
					<XAxis dataKey="number" />
					<YAxis />
					<Tooltip />
					<Bar dataKey="count" fill="#00f6ff" />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
