export interface TabDef {
	id: string
	label: string
}

export default function TabNav({ tabs, active, onChange }: { tabs: TabDef[]; active: string; onChange: (id: string) => void }) {
	return (
		<nav className="tab-nav" role="tablist" aria-label="Sections">
			{tabs.map(tab => (
				<button
					key={tab.id}
					role="tab"
					aria-selected={active === tab.id}
					className={active === tab.id ? "tab-btn active" : "tab-btn"}
					onClick={() => onChange(tab.id)}
				>
					{tab.label}
				</button>
			))}
		</nav>
	)
}
