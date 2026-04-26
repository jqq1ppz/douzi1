"use client";

import { useState, useEffect } from "react";
import { HiSun, HiMoon } from "react-icons/hi";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	// Only render after component is mounted to prevent hydration mismatch
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className="w-10 h-10" />;
	}

	return (
		<button
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<HiSun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
			) : (
				<HiMoon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
			)}
		</button>
	);
}
