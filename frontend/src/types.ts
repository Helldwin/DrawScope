export interface PrizeTier {
	rank: number
	winners: number
	payout: number | null
}

export type WinnersByDate = Record<string, PrizeTier[]>

export interface Draw {
	date: string
	numbers: number[]
	chance: number
	winners?: PrizeTier[]
}

export interface DrawScopeData {
	last_update: string
	draws: Draw[]
}

/** A pre-2008 draw: 6 boules + a single "boule complémentaire" instead of 5 boules + numéro chance. */
export interface LegacyDraw {
	date: string
	numbers: number[]
	complementary: number
	currency: "eur" | "frf"
	winners?: PrizeTier[]
}

export interface SuperLotoArchive {
	modern: Draw[]
	legacy: LegacyDraw[]
}
