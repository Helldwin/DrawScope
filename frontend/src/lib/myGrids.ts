export interface SavedGrid {
	id: string
	numbers: number[]
	chance: number | null
	label: string
	savedAt: string
}

const STORAGE_KEY = "drawscope-my-grids"

function readStorage(): SavedGrid[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? parsed : []
	} catch {
		return []
	}
}

function writeStorage(grids: SavedGrid[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(grids))
	} catch {
		// private browsing / storage full — saved grids just won't persist
	}
}

export function loadSavedGrids(): SavedGrid[] {
	return readStorage().sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

function makeId(): string {
	return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function addSavedGrid(numbers: number[], chance: number | null, label = ""): SavedGrid {
	const grid: SavedGrid = {
		id: makeId(),
		numbers: [...numbers].sort((a, b) => a - b),
		chance,
		label,
		savedAt: new Date().toISOString()
	}
	writeStorage([grid, ...readStorage()])
	return grid
}

export function removeSavedGrid(id: string): void {
	writeStorage(readStorage().filter(g => g.id !== id))
}

/** A grid is already saved if the same 5 numbers are already in the list (chance number doesn't affect identity). */
export function isGridSaved(numbers: number[], grids: SavedGrid[]): boolean {
	const key = [...numbers].sort((a, b) => a - b).join(",")
	return grids.some(g => g.numbers.join(",") === key)
}
