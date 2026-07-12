export interface Bucket {
	label: string
	count: number
}

export function bucketize(values: number[], bucketCount: number): Bucket[] {
	if (values.length === 0) return []
	const min = Math.min(...values)
	const max = Math.max(...values)
	const span = max - min || 1
	const size = span / bucketCount

	const buckets = Array.from({ length: bucketCount }, (_, i) => ({
		start: Math.round(min + i * size),
		end: Math.round(min + (i + 1) * size),
		count: 0
	}))

	for (const v of values) {
		const idx = Math.min(bucketCount - 1, Math.floor((v - min) / size))
		buckets[idx].count++
	}

	return buckets.map(b => ({ label: `${b.start}-${b.end}`, count: b.count }))
}

export default function Histogram({ buckets }: { buckets: Bucket[] }) {
	const max = Math.max(...buckets.map(b => b.count), 1)

	return (
		<div className="histogram" role="img" aria-label="Distribution des sommes des tirages">
			{buckets.map(b => (
				<div className="histogram-bar-col" key={b.label}>
					<div className="histogram-bar" style={{ height: `${(b.count / max) * 100}%` }} title={`${b.label} : ${b.count} tirages`} />
					<span className="histogram-label">{b.label}</span>
				</div>
			))}
		</div>
	)
}
