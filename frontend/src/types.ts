export interface Draw {
	date: string
	numbers: number[]
	chance: number
}

export interface DrawScopeData {
	last_update: string
	draws: Draw[]
}
