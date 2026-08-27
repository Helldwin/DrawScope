import { useEffect, useRef, useState } from "react"

/** Fetches `url` as JSON the first time `enabled` becomes true, and caches the result (null while unfetched or loading). */
export function useLazyJson<T>(url: string, enabled: boolean): T | null {
	const [data, setData] = useState<T | null>(null)
	const requested = useRef(false)

	useEffect(() => {
		if (!enabled || requested.current) return
		requested.current = true
		fetch(url)
			.then(res => res.json())
			.then(setData)
			.catch(() => setData(null))
	}, [enabled, url])

	return data
}
