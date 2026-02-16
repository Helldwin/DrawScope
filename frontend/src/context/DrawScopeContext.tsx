// src/context/DrawScopeContext.tsx
import React, { createContext, useState, ReactNode } from "react";

interface DrawScopeParams {
	minFrequency: number;
	maxFrequency: number;
	showTopNumbers: boolean;
	[key: string]: any; // pour ajouter d'autres sliders facilement
}

interface DrawScopeContextType {
	params: DrawScopeParams;
	setParams: React.Dispatch<React.SetStateAction<DrawScopeParams>>;
}

export const DrawScopeContext = createContext<DrawScopeContextType>({
	params: {
		minFrequency: 0,
		maxFrequency: 49,
		showTopNumbers: true,
	},
	setParams: () => { },
});

export const DrawScopeProvider = ({ children }: { children: ReactNode }) => {
	const [params, setParams] = useState<DrawScopeParams>({
		minFrequency: 0,
		maxFrequency: 49,
		showTopNumbers: true,
	});

	return (
		<DrawScopeContext.Provider value={{ params, setParams }}>
			{children}
		</DrawScopeContext.Provider>
	);
};
