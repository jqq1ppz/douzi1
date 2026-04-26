"use client";

import { useState, Suspense } from "react";
import { useEffect } from "react";
import PlayerHistory from "../components/PlayerHistory";
import type { Game, GameDay, Player } from "../types";
import { SEASONS } from "../types/index";
import { FaFlag, FaSkullCrossbones, FaTwitch } from "react-icons/fa6";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner";
import { TWITCH_USERNAMES } from "../constants/twitch";
import { GiCrossedSwords, GiPistolGun } from "react-icons/gi";

interface TwitchStreamData {
	user_name: string;
	is_live: boolean;
}

interface TwitchVOD {
	id: string;
	title: string;
	url: string;
	thumbnail_url: string;
	created_at: string;
	duration: string;
	view_count: number;
}

function timeAgo(date: string) {
	const seconds = Math.floor(
		(new Date().getTime() - new Date(date).getTime()) / 1000,
	);

	let interval = seconds / 31536000;
	if (interval > 1) return Math.floor(interval) + " years ago";

	interval = seconds / 2592000;
	if (interval > 1) return Math.floor(interval) + " months ago";

	interval = seconds / 86400;
	if (interval > 1) return Math.floor(interval) + " days ago";

	interval = seconds / 3600;
	if (interval > 1) return Math.floor(interval) + " hours ago";

	interval = seconds / 60;
	if (interval > 1) return Math.floor(interval) + " minutes ago";

	return Math.floor(seconds) + " seconds ago";
}

function PlayersContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [mounted, setMounted] = useState(false);
	const [players, setPlayers] = useState<Player[]>([]);
	const [sortedPlayers, setSortedPlayers] = useState<string[]>([]);
	const [selectedPlayer, setSelectedPlayer] = useState<string>("");
	const [gameDays, setGameDays] = useState<GameDay[]>([]);
	const [loading, setLoading] = useState(true);
	const [liveStreamers, setLiveStreamers] = useState<string[]>([]);
	const [recentVODs, setRecentVODs] = useState<TwitchVOD[]>([]);
	const [excludeSurrendered, setExcludeSurrendered] = useState(false);
	const [selectedSeason, setSelectedSeason] = useState(
		SEASONS[SEASONS.length - 1],
	);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Handle URL changes
	useEffect(() => {
		if (!mounted || sortedPlayers.length === 0) return;

		const playerFromUrl = searchParams?.get("name");
		if (playerFromUrl && sortedPlayers.includes(playerFromUrl)) {
			setSelectedPlayer(playerFromUrl);
		} else if (!playerFromUrl) {
			router.replace(`/players?name=${encodeURIComponent(sortedPlayers[0])}`, {
				scroll: false,
			});
			setSelectedPlayer(sortedPlayers[0]);
		}
	}, [searchParams, mounted, sortedPlayers]);

	// Separate data fetching into smaller chunks
	useEffect(() => {
		if (!mounted) return;

		const fetchInitialData = async () => {
			try {
				setLoading(true);
				// Fetch players and gamedays in parallel
				const [playersRes, gameDaysRes] = await Promise.all([
					fetch("/api/players"),
					fetch("/api/gamedays"),
				]);

				const [playersData, gameDaysData] = await Promise.all([
					playersRes.json(),
					gameDaysRes.json(),
				]);

				setPlayers(playersData);
				setGameDays(gameDaysData);

				if (playersData.length > 0) {
					const sorted = [...playersData]
						.sort((a: Player, b: Player) => {
							const aRounds = gameDaysData.reduce(
								(total: number, day: GameDay) =>
									total +
										day.games?.filter(
											(game: Game) =>
												game.winners.includes(a.name) ||
												game.losers.includes(a.name),
										).length || 0,
								0,
							);
							const bRounds = gameDaysData.reduce(
								(total: number, day: GameDay) =>
									total +
										day.games?.filter(
											(game: Game) =>
												game.winners.includes(b.name) ||
												game.losers.includes(b.name),
										).length || 0,
								0,
							);
							return bRounds - aRounds;
						})
						.map((p: Player) => p.name);

					setSortedPlayers(sorted);
				}
			} catch (error) {
				console.error("Error fetching initial data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchInitialData();
	}, [mounted]);

	// Separate Twitch data fetching
	useEffect(() => {
		if (!mounted) return;

		const fetchTwitchData = async () => {
			// Get all Twitch usernames
			const allTwitchUsernames = Object.values(TWITCH_USERNAMES);
			if (allTwitchUsernames.length > 0) {
				try {
					const streamRes = await fetch("/api/twitch/streams", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							channels: allTwitchUsernames,
						}),
					});

					const streamData = await streamRes.json();
					console.log("Stream Data:", streamData);

					setLiveStreamers(
						streamData
							.filter((stream: TwitchStreamData) => stream.is_live)
							.map((stream: TwitchStreamData) => stream.user_name),
					);
					console.log("Live Streamers:", liveStreamers);

					// Only fetch VODs for selected player
					if (selectedPlayer && TWITCH_USERNAMES[selectedPlayer]) {
						const vodsRes = await fetch("/api/twitch/vods", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								channel: TWITCH_USERNAMES[selectedPlayer],
							}),
						});
						const vodsData = await vodsRes.json();
						setRecentVODs(vodsData);
					}
				} catch (error) {
					console.error("Error fetching Twitch data:", error);
				}
			}
		};

		fetchTwitchData();
	}, [mounted, selectedPlayer]);

	const handlePlayerClick = (playerName: string) => {
		router.push(`/players?name=${encodeURIComponent(playerName)}`, {
			scroll: false,
		});
	};

	function calculatePlayerStats(playerName: string) {
		const excludedDates = ["2025-01-31", "2025-01-28"];
		let totalGames = 0;
		let totalRounds = 0;
		let totalWins = 0;
		let totalLosses = 0;
		let balance = 0;
		let surrenderWins = 0;
		let surrenderLosses = 0;

		const playedDays = new Set();

		gameDays.forEach(day => {
			const gameDate = new Date(day.date);
			const isInSeason =
				gameDate >= selectedSeason.startDate &&
				(!selectedSeason.endDate || gameDate <= selectedSeason.endDate);

			if (!isInSeason) return;

			if (
				selectedSeason.id === 1 &&
				playerName === "Poopie" &&
				excludedDates.includes(gameDate.toISOString().split("T")[0])
			) {
				return;
			}

			let playerPlayedThisDay = false;

			day.games?.forEach(game => {
				if (
					game.winners.includes(playerName) ||
					game.losers.includes(playerName)
				) {
					if (excludeSurrendered && game.gameType === "surrendered") {
						return;
					}
					totalRounds++;
					playerPlayedThisDay = true;

					if (game.winners.includes(playerName)) {
						totalWins++;
						if (game.gameType === "surrendered") {
							surrenderWins++;
							if (!excludeSurrendered) {
								balance += 25;
							}
						} else {
							balance += 50;
						}
					}
					if (game.losers.includes(playerName)) {
						totalLosses++;
						if (game.gameType === "surrendered") {
							surrenderLosses++;
							if (!excludeSurrendered) {
								balance -= 25;
							}
						} else {
							balance -= 50;
						}
					}
				}
			});

			if (playerPlayedThisDay) {
				playedDays.add(day.id);
			}
		});

		totalGames = playedDays.size;

		return {
			totalGames,
			totalRounds,
			totalWins,
			totalLosses,
			balance:
				playerName === "蛋蛋" && selectedSeason.id === 3
					? balance + 200
					: balance,
			surrenderWins,
			surrenderLosses,
		};
	}

	const getPlayerTotalRounds = (playerName: string) => {
		let totalRounds = 0;
		gameDays.forEach(day => {
			day.games?.forEach(game => {
				if (
					game.winners.includes(playerName) ||
					game.losers.includes(playerName)
				) {
					totalRounds++;
				}
			});
		});
		return totalRounds;
	};

	if (loading) return <LoadingSpinner />;

	const playerStats = calculatePlayerStats(selectedPlayer);

	return (
		<div className="flex h-screen relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
			{/* Sidebar */}
			<div className="w-16 md:w-48 bg-gray-900/50 backdrop-blur-sm overflow-y-auto border-r border-pink-500/20 shrink-0">
				{sortedPlayers
					.sort((a, b) => {
						const aIsLive =
							TWITCH_USERNAMES[a] &&
							liveStreamers.includes(TWITCH_USERNAMES[a]);
						const bIsLive =
							TWITCH_USERNAMES[b] &&
							liveStreamers.includes(TWITCH_USERNAMES[b]);

						if (aIsLive && !bIsLive) return -1;
						if (!aIsLive && bIsLive) return 1;
						return 0;
					})
					.map(player => (
						<div
							key={player}
							onClick={() => handlePlayerClick(player)}
							className={`p-2 cursor-pointer transition-all duration-200
								${
									selectedPlayer === player
										? "bg-pink-500/10 border-l-2 border-pink-500"
										: "hover:bg-pink-500/5 border-l-2 border-transparent"
								}
								flex flex-col justify-center items-center gap-2 relative`}
						>
							<div className="relative">
								<div
									className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 px-1 font-medium
									${
										selectedPlayer === player
											? "bg-purple-900/50 text-purple-100 ring-2 ring-purple-500/50"
											: "bg-gray-800 text-gray-300 hover:bg-gray-700"
									}
									${
										TWITCH_USERNAMES[player] &&
										liveStreamers.includes(TWITCH_USERNAMES[player])
											? "ring-4 ring-red-500 animate-border-pulse"
											: ""
									}`}
								>
									<span
										className={`
										${
											/[\u4e00-\u9fa5]/.test(player)
												? player.length > 3
													? "text-[10px]"
													: "text-xs"
												: "text-xs"
										}
									`}
									>
										{player}
									</span>
								</div>
								{TWITCH_USERNAMES[player] &&
									liveStreamers.includes(TWITCH_USERNAMES[player]) && (
										<div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
											<span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
												LIVE
											</span>
										</div>
									)}
							</div>
							<span className="text-xs text-gray-500">
								{getPlayerTotalRounds(player)}
							</span>
						</div>
					))}
			</div>

			{/* Main Content */}
			<div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-900 to-gray-800">
				{/* Stats Card */}
				<div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 shadow-lg mb-6">
					<div className="flex justify-between items-center mb-6">
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
								{selectedPlayer}
							</h1>
							<div className="flex items-center gap-2">
								{liveStreamers.includes(TWITCH_USERNAMES[selectedPlayer]) && (
									<span className="flex items-center gap-1 text-xs text-red-400">
										<span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
										LIVE
									</span>
								)}
							</div>
						</div>

						{/* Season Dropdown */}
						<div className="relative">
							<select
								value={selectedSeason.id}
								onChange={e =>
									setSelectedSeason(SEASONS[Number(e.target.value) - 1])
								}
								className="appearance-none bg-gray-900/50 border border-purple-500/20 text-gray-200 text-sm rounded-lg pl-4 pr-10 py-2.5
								focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none
								backdrop-blur-sm hover:bg-gray-800/50 transition-colors cursor-pointer
								font-medium shadow-lg shadow-purple-500/5"
							>
								{SEASONS.map(season => (
									<option key={season.id} value={season.id}>
										S{season.id}
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
					</div>

					<div className="mb-4">
						<label className="flex items-center space-x-2 text-white/80 cursor-pointer text-sm">
							<input
								type="checkbox"
								checked={excludeSurrendered}
								onChange={e => setExcludeSurrendered(e.target.checked)}
								className="form-checkbox h-4 w-4 text-purple-500 rounded border-gray-600 bg-gray-700 focus:ring-offset-0 focus:ring-1 focus:ring-purple-500 checked:bg-purple-500 checked:hover:bg-purple-600"
							/>
							<span>Played games</span>
						</label>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
						<StatCard
							title="Game Days"
							value={playerStats.totalGames}
							icon={<GiCrossedSwords className="w-5 h-5 text-yellow-300" />}
						/>
						<StatCard
							title="Rounds"
							value={playerStats.totalRounds}
							icon={<GiPistolGun className="w-5 h-5 text-white" fill="white" />}
						/>
						<StatCard
							title="Wins"
							value={playerStats.totalWins}
							icon="🏆"
							subValue={
								playerStats.surrenderWins > 0 && (
									<span className="text-sm text-gray-400 flex items-center gap-1">
										<FaFlag className="w-3 h-3 text-green-500" />
										{playerStats.surrenderWins}
									</span>
								)
							}
						/>
						<StatCard
							title="Losses"
							value={playerStats.totalLosses}
							icon={<FaSkullCrossbones className="w-5 h-5 text-red-400" />}
							subValue={
								playerStats.surrenderLosses > 0 && (
									<span className="text-sm text-gray-400 flex items-center gap-1">
										<FaFlag className="w-3 h-3 text-red-500" />
										{playerStats.surrenderLosses}
									</span>
								)
							}
						/>
						<StatCard
							title="Balance"
							value={playerStats.balance}
							icon={playerStats.balance >= 0 ? "💰" : "💸"}
							valueClassName={
								playerStats.balance >= 0 ? "text-green-400" : "text-red-400"
							}
						/>
						{/* Twitch Card */}
						{TWITCH_USERNAMES[selectedPlayer] && (
							<StatCard
								title="Twitch"
								value={
									<a
										href={`https://www.twitch.tv/${TWITCH_USERNAMES[selectedPlayer]}`}
										target="_blank"
										rel="noopener noreferrer"
										className="flex flex-col items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
									>
										<span className="text-sm flex flex-col items-center">
											<span>{TWITCH_USERNAMES[selectedPlayer]}</span>
											{liveStreamers.includes(
												TWITCH_USERNAMES[selectedPlayer],
											) && (
												<span className="text-red-400 animate-pulse">
													Watch Now
												</span>
											)}
										</span>
									</a>
								}
								icon={<FaTwitch className="w-5 h-5 text-purple-400" />}
								customContent
							/>
						)}
					</div>
				</div>

				{/* Player History */}
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 shadow-lg p-6 mb-6">
					<PlayerHistory
						player={selectedPlayer}
						gameDays={gameDays}
						className="bg-transparent"
						selectedSeason={selectedSeason}
					/>
				</div>

				{/* Twitch Section */}
				{TWITCH_USERNAMES[selectedPlayer] && (
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-purple-500/20 shadow-lg p-6">
						<h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
							Twitch Activity
						</h2>

						{/* Last Stream Time */}
						{recentVODs.length > 0 && (
							<div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
								Last stream: {timeAgo(recentVODs[0].created_at)}
							</div>
						)}

						{/* Recent Broadcasts */}
						<div className="overflow-y-auto">
							<h3 className="text-lg font-semibold mb-4 dark:text-white">
								Recent Broadcasts
							</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{recentVODs.length > 0 ? (
									recentVODs.map((broadcast, index) => (
										<div key={index} className="mb-4">
											<a
												href={broadcast.url}
												target="_blank"
												rel="noopener noreferrer"
												className="group relative overflow-hidden rounded-lg"
											>
												<img
													src={broadcast.thumbnail_url
														.replace("%{width}", "320")
														.replace("%{height}", "180")}
													alt={broadcast.title}
													className="w-full h-auto rounded-lg"
												/>
												<div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
													<p className="text-white text-sm truncate">
														{broadcast.title}
													</p>
													<div className="flex justify-between items-center mt-1">
														<span className="text-gray-300 text-xs">
															{timeAgo(broadcast.created_at)}
														</span>
														<span className="text-gray-300 text-xs">
															{broadcast.duration}
														</span>
													</div>
												</div>
											</a>
										</div>
									))
								) : (
									<div className="text-gray-600 dark:text-gray-400">
										No recent broadcasts found.
									</div>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function StatCard({
	title,
	value,
	icon,
	subValue,
	valueClassName = "text-gray-200",
	suffix,
	customContent,
}: {
	title: string;
	value: number | React.ReactNode;
	icon: React.ReactNode;
	subValue?: React.ReactNode;
	valueClassName?: string;
	suffix?: string;
	customContent?: boolean;
}) {
	return (
		<div className="p-4 rounded-lg bg-gray-900/50 border border-pink-500/10 hover:border-pink-500/30 transition-colors">
			<div className="flex flex-col items-center gap-2">
				<div className="flex items-center gap-2">
					<span className="text-lg">{icon}</span>
					<span className="text-sm font-medium text-gray-400">{title}</span>
				</div>
				<div className="flex items-center justify-center w-full">
					{customContent ? (
						value
					) : (
						<span className={`text-2xl font-bold ${valueClassName}`}>
							{value}
							{suffix}
						</span>
					)}
					{subValue && <div className="ml-2">{subValue}</div>}
				</div>
			</div>
		</div>
	);
}

export default function PlayersPage() {
	return (
		<Suspense fallback={<LoadingSpinner />}>
			<PlayersContent />
		</Suspense>
	);
}
