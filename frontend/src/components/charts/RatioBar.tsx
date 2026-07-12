export default function RatioBar({
	leftLabel,
	leftValue,
	rightLabel,
	rightValue
}: {
	leftLabel: string
	leftValue: number
	rightLabel: string
	rightValue: number
}) {
	const total = leftValue + rightValue || 1
	const leftPct = (leftValue / total) * 100
	const rightPct = 100 - leftPct

	return (
		<div className="ratio-bar">
			<div className="ratio-bar-track">
				<div className="ratio-bar-segment ratio-bar-left" style={{ width: `${leftPct}%` }} />
				<div className="ratio-bar-segment ratio-bar-right" style={{ width: `${rightPct}%` }} />
			</div>
			<div className="ratio-bar-legend">
				<span><span className="dot dot-left" />{leftLabel} — {leftValue} ({leftPct.toFixed(0)}%)</span>
				<span><span className="dot dot-right" />{rightLabel} — {rightValue} ({rightPct.toFixed(0)}%)</span>
			</div>
		</div>
	)
}
