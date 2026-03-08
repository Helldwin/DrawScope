export default function RecentDraws({ data }: any) {

	return (
		<div>
			<h2>Recent Draws</h2>
			<ul>
				{data.map((d: any, i: number) => (
					<li key={i}>{d.join(" - ")}</li>
				))}
			</ul>
		</div>
	)
}
