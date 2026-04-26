import type { Config } from "tailwindcss";

export default {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
			},
			screens: {
				xs: "475px",
			},
			keyframes: {
				"border-pulse": {
					"0%, 100%": { boxShadow: "0 0 0 3px rgb(239 68 68 / 1)" },
					"50%": { boxShadow: "0 0 0 3px rgb(252 165 165 / 1)" },
				},
				newGame: {
					"0%": { boxShadow: "0 0 0 0 rgba(168, 85, 247, 0.4)" },
					"70%": { boxShadow: "0 0 0 10px rgba(168, 85, 247, 0)" },
					"100%": { boxShadow: "0 0 0 0 rgba(168, 85, 247, 0)" },
				},
			},
			animation: {
				"border-pulse": "border-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				newGame: "newGame 2s ease-in-out",
			},
		},
	},
	plugins: [],
} satisfies Config;
