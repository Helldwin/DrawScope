import { useState, useEffect } from "react";

export default function DashboardSection({
	title,
	children,
	globalToggle
}: {
	title: string;
	children: React.ReactNode;
	globalToggle?: boolean | null;
}) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (globalToggle !== null && globalToggle !== undefined) {
			setOpen(globalToggle);
		}
	}, [globalToggle]);

	return (
		<div className="bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300">
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex justify-between items-center
                   px-6 py-4 text-left font-bold text-lg
                   hover:bg-gray-700 rounded-t-xl transition-colors duration-200"
			>
				<span>{title}</span>
				<span className="text-xl">{open ? "▲" : "▼"}</span>
			</button>
			{open && (
				<div className="p-6 border-t border-gray-700 transition-colors duration-200">
					{children}
				</div>
			)}
		</div>
	);
}
