import { useId, useState } from "react"

/** Small "?" icon that reveals a short explanation on hover, focus, or tap — for jargon that isn't self-explanatory. */
export default function InfoTooltip({ text }: { text: string }) {
	const [open, setOpen] = useState(false)
	const id = useId()

	return (
		<span className="info-tooltip">
			<button
				type="button"
				className="info-tooltip-trigger"
				aria-describedby={id}
				aria-expanded={open}
				onClick={() => setOpen(o => !o)}
				onBlur={() => setOpen(false)}
			>
				?<span className="sr-only">Aide</span>
			</button>
			<span role="tooltip" id={id} className={open ? "info-tooltip-bubble visible" : "info-tooltip-bubble"}>
				{text}
			</span>
		</span>
	)
}
