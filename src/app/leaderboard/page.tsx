"use client";

import { useState, useEffect } from "react";
import { FaSort, FaSortUp, FaSortDown, FaTrophy } from "react-icons/fa";

import Link from "next/link";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

import { SEASONS } from "../types/index";
import { Season } from "../types/index";

import LoadingTable from "../components/LoadingTable";

type SortField = "balance" | "rounds" | "winRatio";
type SortDirection = "asc" | "desc";

interface PlayerStats {
	name: string;
	balance: number;
	rounds: number;
	winRatio: number;
	hasPlayedAfterCutoff: boolean;
}

export default function LeaderboardPage() {
	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [sortField, setSortField] = useState<SortField>("balance");
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
	const [excludeSurrendered, setExcludeSurrendered] = useState(false);
	const [selectedSeason, setSelectedSeason] = useState<Season>(
		SEASONS[SEASONS.length - 1],
	);

	useEffect(() => {
		setMounted(true);
		fetchLeaderboard();
	}, [selectedSeason, excludeSurrendered]);

	const fetchLeaderboard = async () => {
		setLoading(true);
		setPlayerStats([]); // Clear old data
		try {
			const response = await fetch(
				`/api/leaderboard?seasonId=${JSON.stringify(
					selectedSeason,
				)}&excludeSurrendered=${excludeSurrendered}`,
			);
			const data = await response.json();
			if (data.stats) {
				// Sort the initial data to show players with rounds first
				const sorted = data.stats.sort((a: PlayerStats, b: PlayerStats) => {
					if (a.rounds === 0 && b.rounds > 0) return 1;
					if (a.rounds > 0 && b.rounds === 0) return -1;

					// Get adjusted balances for special cases
					const aBalance =
						a.name === "Poopie" && selectedSeason.id === 1
							? a.balance + 625
							: a.name === "蛋蛋" && selectedSeason.id === 3
							? a.balance + 200
							: a.balance;
					const bBalance =
						b.name === "Poopie" && selectedSeason.id === 1
							? b.balance + 625
							: b.name === "蛋蛋" && selectedSeason.id === 3
							? b.balance + 200
							: b.balance;

					return bBalance - aBalance; // Default sort by balance
				});
				setPlayerStats(sorted);
			}
		} catch (error) {
			console.error("Error fetching leaderboard:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSort = (field: SortField) => {
		const newDirection =
			sortField === field && sortDirection === "desc" ? "asc" : "desc";
		setSortField(field);
		setSortDirection(newDirection);

		const sorted = [...playerStats].sort((a, b) => {
			// First, separate players with rounds from those without
			if (a.rounds === 0 && b.rounds > 0) return 1;
			if (a.rounds > 0 && b.rounds === 0) return -1;

			// Get adjusted balances for special cases
			const aBalance =
				a.name === "Poopie" && selectedSeason.id === 1
					? a.balance + 625
					: a.name === "蛋蛋" && selectedSeason.id === 3
					? a.balance + 200
					: a.balance;
			const bBalance =
				b.name === "Poopie" && selectedSeason.id === 1
					? b.balance + 625
					: b.name === "蛋蛋" && selectedSeason.id === 3
					? b.balance + 200
					: b.balance;

			// Then apply the regular sorting for players in the same category
			if (field === "balance") {
				if (newDirection === "asc") {
					return aBalance - bBalance;
				} else {
					return bBalance - aBalance;
				}
			} else {
				if (newDirection === "asc") {
					return a[field] - b[field];
				} else {
					return b[field] - a[field];
				}
			}
		});

		setPlayerStats(sorted);
	};

	const getSortIcon = (field: SortField) => {
		if (sortField !== field) return <FaSort className="ml-2 inline" />;
		return sortDirection === "desc" ? (
			<FaSortDown className="ml-2 inline" />
		) : (
			<FaSortUp className="ml-2 inline" />
		);
	};

	// Prevent hydration issues by not rendering until mounted
	if (!mounted) return null;

	return (
		<div className="container mx-auto pt-10 p-4">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 1 }}
				className="flex items-center justify-center mb-4 gap-2 px-4"
			>
				<FaTrophy className="text-yellow-500 text-2xl sm:text-4xl" />
				<h1 className="text-xl sm:text-3xl font-bold text-center bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text whitespace-nowrap">
					{selectedSeason.name} Leaderboard
				</h1>
				<FaTrophy className="text-yellow-500 text-2xl sm:text-4xl" />
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="mb-4 flex justify-center items-center gap-4"
			>
				<div className="relative">
					<select
						value={selectedSeason.id}
						onChange={e => {
							const seasonId = Number(e.target.value);
							const season =
								SEASONS.find(candidate => candidate.id === seasonId) ??
								selectedSeason;
							setSelectedSeason(season);
						}}
						className="appearance-none bg-gray-900/50 border border-purple-500/20 text-gray-200 text-sm rounded-lg pl-4 pr-10 py-2.5
						focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none
						backdrop-blur-sm hover:bg-gray-800/50 transition-colors cursor-pointer
						font-medium shadow-lg shadow-purple-500/5"
					>
						{SEASONS.map(season => (
							<option key={season.id} value={season.id}>
								{season.id === 0 ? "Total Seasons" : `S${season.id}`}
							</option>
						))}
					</select>
					<div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
						<svg
							className="w-4 h-4 text-purple-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>

				<label className="flex items-center text-sm space-x-2 text-white/90 cursor-pointer">
					<input
						type="checkbox"
						checked={excludeSurrendered}
						onChange={e => setExcludeSurrendered(e.target.checked)}
						className="form-checkbox h-4 w-4 text-purple-500 rounded border-gray-600 bg-gray-700 focus:ring-offset-0 focus:ring-1 focus:ring-purple-500 checked:bg-purple-500 checked:hover:bg-purple-600"
					/>
					<span>Played games</span>
				</label>
			</motion.div>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.4 }}
				className="overflow-hidden rounded-xl shadow-lg border border-purple-500/20 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"
			>
				<table className="w-full">
					<motion.thead
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.6 }}
						className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 backdrop-blur-sm"
					>
						<tr>
							<th className="w-8 sm:w-24 px-1 sm:px-6 py-4 text-center text-base sm:text-lg font-bold text-white/90 uppercase tracking-wider">
								Rank
							</th>
							<th className="px-1 sm:px-6 py-4 text-center text-base sm:text-lg font-bold text-white/90 uppercase tracking-wider">
								Player
							</th>
							<th
								className="px-1 sm:px-6 py-4 text-center text-base sm:text-lg font-bold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
								onClick={() => handleSort("balance")}
							>
								Balance {getSortIcon("balance")}
							</th>
							<th
								className="px-1 sm:px-6 py-4 text-center text-base sm:text-lg font-bold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
								onClick={() => handleSort("rounds")}
							>
								<div className="flex items-center justify-center">
									Rounds {getSortIcon("rounds")}
								</div>
							</th>
							{selectedSeason.id >= 2 && (
								<th
									className="hidden sm:table-cell px-6 py-4 text-center text-base sm:text-lg font-bold text-white/90 uppercase tracking-wider cursor-pointer hover:bg-gray-700/50 transition-colors"
									onClick={() => handleSort("winRatio")}
								>
									Win Ratio {getSortIcon("winRatio")}
								</th>
							)}
						</tr>
					</motion.thead>
					<tbody className="divide-y divide-purple-500/10">
						{loading || !playerStats.length ? (
							<tr>
								<td colSpan={selectedSeason.id >= 2 ? 5 : 4}>
									<LoadingTable rows={5} />
								</td>
							</tr>
						) : (
							playerStats.map((player, index) => (
								<motion.tr
									key={player.name}
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ duration: 0.3, delay: index * 0.05 }}
									className="group hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-pink-500/5 transition-all duration-300"
								>
									<td className="w-8 sm:w-24 px-1 sm:px-6 py-4 whitespace-nowrap text-center">
										<div
											className={`
												w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold mx-auto text-base sm:text-lg
												${
													index === 0
														? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
														: index === 1
														? "bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800"
														: index === 2
														? "bg-gradient-to-r from-amber-600 to-amber-800 text-white"
														: "text-gray-400"
												}
											`}
										>
											{index + 1}
										</div>
									</td>
									<td className="px-1 sm:px-6 py-4 whitespace-nowrap text-base sm:text-lg font-medium text-center">
										<Link
											href={`/players?name=${encodeURIComponent(player.name)}`}
											className="text-white hover:text-purple-400 transition-colors"
										>
											{player.name}
										</Link>
									</td>
									<td
										className={`px-1 sm:px-6 py-4 whitespace-nowrap text-base sm:text-lg font-bold text-center ${
											player.name === "Poopie" && selectedSeason.id === 1
												? player.balance + 625 > 0
													? "text-green-400"
													: player.balance + 625 < 0
													? "text-red-400"
													: "text-gray-400"
												: player.name === "蛋蛋" && selectedSeason.id === 3
												? player.balance + 200 > 0
													? "text-green-400"
													: player.balance + 200 < 0
													? "text-red-400"
													: "text-gray-400"
												: player.balance > 0
												? "text-green-400"
												: player.balance < 0
												? "text-red-400"
												: "text-gray-400"
										}`}
									>
										{player.name === "Poopie" && selectedSeason.id === 1 ? (
											<>
												{player.balance + 625 > 0 ? "+" : ""}
												{player.balance + 625}
											</>
										) : player.name === "蛋蛋" && selectedSeason.id === 3 ? (
											<>
												{player.balance + 200 > 0 ? "+" : ""}
												{player.balance + 200}
											</>
										) : (
											<>
												{player.balance > 0 ? "+" : ""}
												{player.balance}
											</>
										)}
									</td>
									<td className="px-1 sm:px-6 py-4 whitespace-nowrap text-base sm:text-lg font-medium text-center text-gray-300">
										{player.rounds}
									</td>
									{selectedSeason.id >= 2 && (
										<td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-base sm:text-lg text-gray-300 font-medium text-center">
											{player.rounds > 0 ? `${player.winRatio}%` : "0.0%"}
										</td>
									)}
								</motion.tr>
							))
						)}
					</tbody>
				</table>
			</motion.div>
		</div>
	);
}
