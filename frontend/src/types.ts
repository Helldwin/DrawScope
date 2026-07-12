export interface RecentDraw {
	date: string
	numbers: number[]
	chance: number
}

export interface DrawScopeData {
	last_update: string
	scores: Record<string, number>
	predictions: number[]
	recent_draws: RecentDraw[]
}
