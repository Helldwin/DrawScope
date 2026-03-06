export default function MonteCarlo({ data }: any) {

	return (

		<div>

			<h2>Monte Carlo</h2>

			<ul>

				{data.map((d: any, i: number) => (
					<li key={i}>
						{d.numbers.join(" - ")}
					</li>
				))}

			</ul>

		</div>

	)

}
