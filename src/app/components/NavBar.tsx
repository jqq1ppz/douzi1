"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaTrophy, FaTwitch, FaUser, FaGamepad } from "react-icons/fa";
import { FaUserGroup } from "react-icons/fa6";
import { GameDay } from "../types/index";
import { customToast } from "../utils/toast";

// List of usernames allowed to see the "Users" and "Manage Players" links
const allowedUsernames = ["dandan", "蛋蛋", "admin", "dan"];

export default function NavBar() {
	const { data: session, status } = useSession();
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);

	const router = useRouter();
	const pathname = usePathname();

	const [activeGame, setActiveGame] = useState<GameDay | null>(null);

	const isMaintenance = process.env.NEXT_PUBLIC_IS_MAINTENANCE === "true";

	// hide navbar on maintenance mode
	if (isMaintenance) {
		return null;
	}

	useEffect(() => {
		const fetchActiveGame = async () => {
			try {
				const response = await fetch("/api/gamedays");
				const data = await response.json();

				// API may return an error object (e.g. DB unavailable) instead of an array.
				if (!response.ok || !Array.isArray(data)) {
					setActiveGame(null);
					return;
				}

				// First try to find a game in progress
				const inProgress = data.find(
					(game: GameDay) => game.status === "IN_PROGRESS",
				);

				if (inProgress) {
					setActiveGame(inProgress);
					return;
				}

				// If no game in progress, get the latest completed game
				const latestCompleted = data
					.filter((game: GameDay) => game.status === "COMPLETED")
					.sort(
						(a: GameDay, b: GameDay) =>
							new Date(b.date).getTime() - new Date(a.date).getTime(),
					)[0];

				setActiveGame(latestCompleted || null);
			} catch (error) {
				console.error("Error fetching active game:", error);
			}
		};

		fetchActiveGame();
	}, []);

	const handleCreateGameDay = async () => {
		try {
			if (!session?.user) {
				router.push("/auth/signin");
				return;
			}

			const response = await fetch("/api/gamedays", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					creatorId: session.user.id,
					creatorName: session.user.name || "Anonymous",
				}),
			});

			if (response.ok) {
				customToast.success("Game day created successfully!");
			}
			const result = await response.json();

			if (result.data?.id) {
				// Wait for the redirect to complete
				await router.push(`/game/${result.data.id}`);
				// Optional: force a refresh after navigation
				router.refresh();
			}
		} catch (error) {
			console.error("Error creating game day:", error);
			customToast.error("Failed to create game day. Please try again.");
		}
	};

	return (
		<nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-purple-500/20 shadow-lg shadow-purple-500/5">
			<div className="max-w-7xl mx-auto px-4">
				<div className="flex justify-between h-16">
					<div className="flex items-center gap-4 overflow-x-auto">
						<Link
							href="/"
							className={`relative px-3 py-2 rounded-lg transition-all duration-200 group ${
								pathname === "/"
									? "text-purple-400 bg-purple-500/10"
									: "text-gray-200 hover:text-purple-400"
							}`}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
							<span className="hidden sm:flex items-center gap-2 relative z-10">
								<FaHome className="w-4 h-4" />
								Home
							</span>
							<FaHome className="sm:hidden w-5 h-5 relative z-10" />
						</Link>
						{activeGame && (
							<Link
								href={`/game/${activeGame.id}`}
								className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors whitespace-nowrap"
							>
								<FaGamepad
									className={`w-5 h-5 ${
										activeGame ? "text-pink-500" : "text-gray-400"
									}`}
								/>
								Current Game
							</Link>
						)}

						<Link
							href="/players"
							className={`relative px-3 py-2 rounded-lg transition-all duration-200 group ${
								pathname === "/players"
									? "text-purple-400 bg-purple-500/10"
									: "text-gray-200 hover:text-purple-400"
							}`}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
							<span className="flex items-center gap-2 relative z-10">
								<FaUserGroup className="w-4 h-4" />
								Players
							</span>
						</Link>

						<Link
							href="/leaderboard"
							className={`relative px-3 py-2 rounded-lg transition-all duration-200 group ${
								pathname === "/leaderboard"
									? "text-purple-400 bg-purple-500/10"
									: "text-gray-200 hover:text-purple-400"
							}`}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
							<span className="flex items-center gap-2 relative z-10">
								<FaTrophy className="w-4 h-4 text-yellow-500" />
								Leaderboard
							</span>
						</Link>

						<Link
							href="/streams"
							className={`relative px-3 py-2 rounded-lg transition-all duration-200 group ${
								pathname === "/streams"
									? "text-purple-400 bg-purple-500/10"
									: "text-gray-200 hover:text-purple-400"
							}`}
						>
							<div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
							<span className="flex items-center gap-2 relative z-10">
								<FaTwitch className="w-4 h-4 text-purple-400" />
								Streams
							</span>
						</Link>

						{allowedUsernames.includes(session?.user?.username || "") && (
							<Link
								href="/manage/users"
								className={`block px-4 py-2 text-gray-200 hover:text-purple-400 hover:bg-purple-500/10 transition-colors whitespace-nowrap ${
									pathname === "/manage/users"
										? "text-purple-400 bg-purple-500/10"
										: ""
								}`}
							>
								<span className="flex items-center gap-2">
									<FaUser className="w-4 h-4" />
									Manage Users
								</span>
							</Link>
						)}
						{allowedUsernames.includes(session?.user?.username || "") && (
							<Link
								href="/manage/players"
								className={`block px-4 py-2 text-gray-200 hover:text-purple-400 hover:bg-purple-500/10 transition-colors whitespace-nowrap ${
									pathname === "/manage/players"
										? "text-purple-400 bg-purple-500/10"
										: ""
								}`}
							>
								<span className="flex items-center gap-2">
									<FaUser className="w-4 h-4" />
									Manage Players
								</span>
							</Link>
						)}
					</div>

					<div className="flex items-center space-x-4">
						{/* <div>
							<ThemeToggle />
						</div> */}
						{status === "loading" ? (
							<div className="w-20 h-8 bg-gray-800 animate-pulse rounded-lg" />
						) : session ? (
							<div className="relative">
								<button
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
									className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-200 hover:text-purple-400 transition-colors whitespace-nowrap"
								>
									{session.user?.name}
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>

								{isDropdownOpen && (
									<div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-purple-500/20 backdrop-blur-sm z-50">
										<button
											onClick={async () => {
												await signOut({ redirect: false });
												router.push("/");
											}}
											className="block w-full px-4 py-2 text-left text-gray-200 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
										>
											Sign out
										</button>
									</div>
								)}
							</div>
						) : (
							<>
								<Link
									href="/auth/signin"
									className="px-3 py-2 rounded-lg text-gray-200 hover:text-purple-400 transition-colors"
								>
									Sign In
								</Link>
								<Link
									href="/auth/signup"
									className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
								>
									Sign Up
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
