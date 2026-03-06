export default function Predictions({ data }: any) {

	const sorted = Object.entries(data)
		.sort((a: any, b: any) => b[1] - a[1])
		.slice(0, 10)

	return (

		<div>

			<h2>Top numbers</h2>

			<ul>

				{sorted.map(([n, v]: any) => (
					<li key={n}>{n} : {v}%</li>
				))}

			</ul>

		</div>

	)

}
