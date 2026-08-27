const common = {
	width: 16,
	height: 16,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.8,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	"aria-hidden": true
}

export function OverviewIcon() {
	return (
		<svg {...common}>
			<rect x="3" y="3" width="8" height="8" rx="1.5" />
			<rect x="13" y="3" width="8" height="5" rx="1.5" />
			<rect x="13" y="10" width="8" height="11" rx="1.5" />
			<rect x="3" y="13" width="8" height="8" rx="1.5" />
		</svg>
	)
}

export function HistoryIcon() {
	return (
		<svg {...common}>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3.5 2" />
		</svg>
	)
}

export function StatsIcon() {
	return (
		<svg {...common}>
			<path d="M4 20V10" />
			<path d="M12 20V4" />
			<path d="M20 20v-7" />
		</svg>
	)
}

export function RulesIcon() {
	return (
		<svg {...common}>
			<line x1="4" y1="7" x2="20" y2="7" />
			<circle cx="9" cy="7" r="2" fill="currentColor" stroke="none" />
			<line x1="4" y1="14" x2="20" y2="14" />
			<circle cx="16" cy="14" r="2" fill="currentColor" stroke="none" />
			<line x1="4" y1="21" x2="20" y2="21" />
			<circle cx="12" cy="21" r="2" fill="currentColor" stroke="none" />
		</svg>
	)
}

export function BacktestIcon() {
	return (
		<svg {...common}>
			<path d="M9 3h6" />
			<path d="M10 3v4.5L5.5 15a5 5 0 0 0 4.3 7.5h4.4a5 5 0 0 0 4.3-7.5L14 7.5V3" />
			<path d="M7.5 16h9" />
		</svg>
	)
}

export function StarIcon() {
	return (
		<svg {...common}>
			<path d="M12 3l2.6 5.8 6.2.6-4.7 4.2 1.4 6.1L12 16.9l-5.5 2.8 1.4-6.1-4.7-4.2 6.2-.6z" />
		</svg>
	)
}

export function GiftIcon() {
	return (
		<svg {...common}>
			<rect x="3" y="9" width="18" height="4" rx="1" />
			<rect x="4" y="13" width="16" height="8" rx="1" />
			<path d="M12 9v12" />
			<path d="M12 9C9.5 9 8 7.5 8 6a2.5 2.5 0 0 1 4-2c1.2 1 1.5 3 1.5 5" />
			<path d="M12 9c2.5 0 4-1.5 4-3a2.5 2.5 0 0 0-4-2c-1.2 1-1.5 3-1.5 5" />
		</svg>
	)
}

export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
	return (
		<svg {...common} fill={filled ? "currentColor" : "none"}>
			<path d="M6 3.5h12a1 1 0 0 1 1 1V21l-7-4-7 4V4.5a1 1 0 0 1 1-1z" />
		</svg>
	)
}
