import type { Draw } from "../types"

export function downloadFile(filename: string, content: string, mime: string) {
	const blob = new Blob([content], { type: mime })
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = filename
	a.click()
	URL.revokeObjectURL(url)
}

export function drawsToCsv(draws: Draw[]): string {
	const header = "date;boule_1;boule_2;boule_3;boule_4;boule_5;chance"
	const rows = draws.map(d => `${d.date};${d.numbers.join(";")};${d.chance}`)
	return [header, ...rows].join("\n")
}

export function scoresToCsv(scores: Record<number, number>): string {
	const header = "numero;score"
	const rows = Object.entries(scores)
		.sort((a, b) => Number(a[0]) - Number(b[0]))
		.map(([n, s]) => `${n};${s.toFixed(4)}`)
	return [header, ...rows].join("\n")
}
