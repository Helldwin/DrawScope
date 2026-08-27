export function SkeletonBar({ width = "100%", height = 14, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
	return <div className="skeleton" style={{ width, height, borderRadius: radius }} />
}

export function SkeletonBall() {
	return <div className="skeleton" style={{ width: 34, height: 34, borderRadius: "50%" }} />
}

export function SkeletonDrawRow() {
	return (
		<div className="draws-row">
			<SkeletonBar width={90} height={13} />
			<span className="draws-balls">
				{Array.from({ length: 6 }, (_, i) => (
					<SkeletonBall key={i} />
				))}
			</span>
		</div>
	)
}

export function SkeletonHistoryList({ rows = 6 }: { rows?: number }) {
	return (
		<ul className="draws-list">
			{Array.from({ length: rows }, (_, i) => (
				<li key={i}>
					<SkeletonDrawRow />
				</li>
			))}
		</ul>
	)
}
