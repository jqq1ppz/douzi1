"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Game, PlayerWithBalance } from "../../types";

import type { GameDay, GameDayStatus, Player } from "@/app/types";
import { useSession } from "next-auth/react";
import ConfirmModal from "@/app/components/ConfirmModal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiArrowLeft, HiArrowRight } from "react-icons/hi";

import { MdOutlineShare } from "react-icons/md";
import { TWITCH_CHANNELS } from "../../constants/twitch";
import { Suspense, lazy } from "react";

import { FiCheck } from "react-icons/fi";
import GameDayBroadcasts from "@/app/components/GameDayBroadcasts";
import type { GameDayBroadcast } from "@/app/components/GameDayBroadcasts";
import { customToast } from "../../utils/toast";
import { FaUndo } from "react-icons/fa";
import { PlayerBalances } from "../../components/PlayerBalances";
import PaymentSummary from "../../components/PaymentSummary";
import GameRecorder from "@/app/components/GameRecorder";
import { SponsorsSection } from "../../components/SponsorsSection";
import AddGameSponsors from "@/app/components/AddGameSponsors";
import LoadingContent from "../../components/LoadingContent";

interface SponsorshipInput {
	playerName: string;
	sponsorName: string;
	percentage: number;
}

interface Props {
	params: Promise<{
		id: string;
	}>;
}

// Lazy load components

const GameHistoryLazy = lazy(() => import("../../components/GameHistory"));

export default function GameDay({ params }: Props) {
	const { id } = use(params);
	const [games, setGames] = useState<Game[]>([]);
	const [players, setPlayers] = useState<PlayerWithBalance[]>([]);
	const [gameDay, setGameDay] = useState<GameDay | null>(null);
	const { data: session } = useSession();
	const [submitterName, setSubmitterName] = useState(
		session?.user?.username || "",
	);
	const [loading, setLoading] = useState(true);
	const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
	const router = useRouter();
	const [userRole, setUserRole] = useState<string | null>(null);
	const [broadcasts, setBroadcasts] = useState<GameDayBroadcast[]>([]);
	const [gameDays, setGameDays] = useState<GameDay[]>([]);
	const [currentGameDay, setCurrentGameDay] = useState<GameDay | null>(null);
	const [isLatestCompleted, setIsLatestCompleted] = useState(false);
	const [playerSponsors, setPlayerSponsors] = useState<Record<string, string>>(
		{},
	);

	const [allPlayers, setAllPlayers] = useState<Player[]>([]);

	const [refreshCounter, setRefreshCounter] = useState(0);

	useEffect(() => {
		const fetchPlayers = async () => {
			try {
				const response = await fetch("/api/players");
				const data = await response.json();
				setAllPlayers(data);
			} catch (error) {
				console.error("Failed to fetch players:", error);
			}
		};

		fetchPlayers();
	}, []);

	// Ensure the Twitch Embed script is loaded
	useEffect(() => {
		if (!window.Twitch) {
			const script = document.createElement("script");
			script.src = "https://embed.twitch.tv/embed/v1.js";
			script.async = true;
			script.onload = () => console.log("Twitch script loaded");
			document.body.appendChild(script);
		}
	}, []);

	const calculateBalances = useCallback((games: Game[]) => {
		const activePlayers = new Map<
			string,
			{ balance: number; wins: number; losses: number }
		>();

		games.forEach(game => {
			const gameAmount = game.amount || 50;
			const actualAmount =
				game.gameType === "surrendered" ? gameAmount / 2 : gameAmount;

			game.winners.forEach(winner => {
				const player = activePlayers.get(winner) || {
					balance: 0,
					wins: 0,
					losses: 0,
				};
				activePlayers.set(winner, {
					balance: player.balance + actualAmount,
					wins: player.wins + 1,
					losses: player.losses,
				});
			});

			game.losers.forEach(loser => {
				const player = activePlayers.get(loser) || {
					balance: 0,
					wins: 0,
					losses: 0,
				};
				activePlayers.set(loser, {
					balance: player.balance - actualAmount,
					wins: player.wins,
					losses: player.losses + 1,
				});
			});
		});

		const activePlayerBalances = Array.from(activePlayers.entries())
			.map(([name, stats]) => ({
				name,
				balance: stats.balance,
				gamesWon: stats.wins,
				gamesLost: stats.losses,
			}))
			.sort((a, b) => b.balance - a.balance);

		setPlayers(activePlayerBalances);
	}, []);

	const fetchGamesData = useCallback(async () => {
		try {
			const response = await fetch(`/api/games?gameDayId=${id}`);
			if (!response.ok) return;

			const data = await response.json();
			setGames(data);
			calculateBalances(data);
			setRefreshCounter(prev => prev + 1);
		} catch (error) {
			console.error("Error fetching games:", error);
		}
	}, [id, calculateBalances]);

	useEffect(() => {
		fetchGamesData();
	}, [fetchGamesData]);

	useEffect(() => {
		const fetchGameDay = async () => {
			setLoading(true);
			try {
				const response = await fetch(`/api/gamedays/${id}`);
				const result = await response.json();
				setGameDay(result.data);
			} catch (error) {
				console.error("Error fetching game day:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchGameDay();
	}, [id]);

	useEffect(() => {
		const loadUserRole = async () => {
			if (session?.user?.username) {
				try {
					const response = await fetch(`/api/users/role`, {
						credentials: "include",
						headers: {
							...(session?.user?.username && {
								Authorization: `Bearer ${session?.user?.username}`,
							}),
						},
					});

					if (response.ok) {
						const data = await response.json();
						setUserRole(data.role);
					} else {
						console.error("Role API error response:", await response.text());
					}
				} catch (error) {
					console.error("Failed to load user role:", error);
				}
			} else {
				console.log("No user session found:", session);
			}
		};

		console.log("Session state:", session);
		loadUserRole();
	}, [session]);

	useEffect(() => {
		if (gameDay?.status === "COMPLETED") {
			fetchTwitchBroadcasts();
		}
	}, [gameDay]);

	useEffect(() => {
		console.log("Fetched Broadcasts:", broadcasts);
		if (broadcasts.length === 0) {
			console.warn("No broadcasts available after filtering.");
		}
	}, [broadcasts]);

	const fetchTwitchBroadcasts = async () => {
		if (games.length === 0) return;

		// Sort games by timestamp to find the first and last game
		const sortedGames = [...games].sort(
			(a, b) =>
				new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);
		const startTime = new Date(sortedGames[0].timestamp);
		const endTime = new Date(sortedGames[sortedGames.length - 1].timestamp);

		// Extend the time frame by 4 hours before and after
		startTime.setHours(startTime.getHours() - 4);
		endTime.setHours(endTime.getHours() + 4);

		console.log("Time Frame:", { startTime, endTime });

		try {
			const response = await fetch("/api/twitch/broadcasts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ channels: TWITCH_CHANNELS }),
			});
			const data = await response.json();

			console.log("API Response Data:", data);

			if (Array.isArray(data)) {
				const filteredBroadcasts = data.filter(broadcast => {
					const broadcastTime = new Date(broadcast.created_at);
					return broadcastTime >= startTime && broadcastTime <= endTime;
				});

				console.log("Filtered Broadcasts:", filteredBroadcasts);

				setBroadcasts(filteredBroadcasts);
			} else {
				console.error("Unexpected data format:", data);
			}
		} catch (error) {
			console.error("Error fetching broadcasts:", error);
		}
	};

	const handleAddGame = async (
		winners: string[],
		losers: string[],
		isSurrendered: boolean,
		submitterName: string,
		sponsorships: SponsorshipInput[],
		map: string | null | undefined,
		amount: number = 50,
	) => {
		try {
			const response = await fetch("/api/games", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					winners,
					losers,
					gameType: isSurrendered ? "surrendered" : "full",
					gameDayId: id,
					createdBy:
						session?.user?.name ||
						submitterName.trim().toLowerCase().replace(/\s+/g, "") ||
						"Anonymous",
					createdById: session?.user?.id || null,
					map,
					sponsorships,
					amount,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to add game");
			}

			const data = await response.json();

			// Update games state
			const updatedGames = [data.data, ...games];
			setGames(updatedGames);

			// Recalculate and update player balances
			calculateBalances(updatedGames);
			setRefreshCounter(prev => prev + 1);

			customToast.success("Game added successfully");
		} catch (error) {
			console.error("Error adding game:", error);
			customToast.error("Failed to add game");
		}
	};

	const handleDeleteGame = async (gameId: string) => {
		try {
			const response = await fetch(`/api/games?id=${gameId}&gameDayId=${id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete game");
			}

			setGames(prevGames => {
				const updatedGames = prevGames.filter(game => game.id !== gameId);
				calculateBalances(updatedGames);
				return updatedGames;
			});

			toast.success("Game deleted successfully");
		} catch (error) {
			console.error("Error deleting game:", error);
			toast.error("Failed to delete game");
		}
	};

	const handleShareButtonClick = () => {
		const date = gameDay ? new Date(gameDay.date) : null;
		const gameDate = date
			? `${date.getMonth() + 1}/${date.getDate()}` // +1 because getMonth() is 0-based
			: "";
		const link = `${window.location.origin}/game/${id}`;
		const textToCopy = `${gameDate}豆: ${link}`;
		navigator.clipboard.writeText(textToCopy);
		toast.success("Link copied to clipboard!");
	};

	const fetchGameDays = async () => {
		try {
			const response = await fetch("/api/gamedays");
			const allGameDays = await response.json();
			setGameDays(allGameDays);

			const initialGameDay = allGameDays.find((day: GameDay) => day.id === id);
			setCurrentGameDay(initialGameDay || null);
		} catch (error) {
			console.error("Error fetching game days:", error);
		}
	};

	useEffect(() => {
		if (id) {
			fetchGameDays();
		}
	}, [id]);

	const handleCompleteGameDay = async () => {
		try {
			const response = await fetch(`/api/gamedays/${id}/complete`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				cache: "no-store",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to complete game day");
			}

			// Update both states
			setGameDay(prevGameDay => ({
				...prevGameDay!,
				status: "COMPLETED" as GameDayStatus,
			}));

			setCurrentGameDay(prevGameDay => ({
				...prevGameDay!,
				status: "COMPLETED" as GameDayStatus,
			}));

			await fetchGameDays();
			await fetchGamesData();

			customToast.success("Game day completed successfully!");
		} catch (error) {
			console.error("Error completing game day:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to complete game day",
			);
		}
	};

	useEffect(() => {
		if (currentGameDay) {
			console.log("Current Game Day:", currentGameDay);
			fetchGamesData();
		}
	}, [currentGameDay]);

	const navigateToGameDay = (offset: number) => {
		if (!currentGameDay) return;

		const currentIndex = gameDays.findIndex(
			day => day.id === currentGameDay.id,
		);
		const newIndex = currentIndex + offset;

		if (newIndex >= 0 && newIndex < gameDays.length) {
			const newGameDay = gameDays[newIndex];
			setCurrentGameDay(newGameDay);
			router.push(`/game/${newGameDay.id}`);
		}
	};

	const displayBroadcasts = (broadcasts: GameDayBroadcast[]) => {
		return broadcasts.filter(broadcast => {
			// Always display broadcasts for "ra1neyy9"
			if (
				broadcast.user_name.toLowerCase() === "ra1neyy9" ||
				broadcast.user_name.toLowerCase() === "ikkkkkkk1228"
			) {
				return true;
			}

			// Check for keywords in the stream title for others
			const keywords = ["🫘", "豆", "豆子"];
			return keywords.some(keyword => broadcast.title.includes(keyword));
		});
	};

	const filteredBroadcasts = displayBroadcasts(broadcasts);

	useEffect(() => {
		const fetchBroadcasts = async () => {
			if (gameDay?.status !== "COMPLETED") return;

			setLoading(true);
			try {
				const response = await fetch("/api/twitch/broadcasts", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ channels: TWITCH_CHANNELS }),
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data = await response.json();
				console.log("Broadcasts data:", data);
				setBroadcasts(data);
			} catch (error) {
				console.error("Error fetching broadcasts:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchBroadcasts();
	}, [gameDay?.status]);

	const handleUndoComplete = async () => {
		try {
			const response = await fetch(`/api/gamedays/${id}/undo`, {
				method: "PUT",
			});

			if (!response.ok) {
				throw new Error("Failed to undo game day completion");
			}

			// Update both states
			setGameDay(prevGameDay => ({
				...prevGameDay!,
				status: "IN_PROGRESS" as GameDayStatus,
			}));

			setCurrentGameDay(prevGameDay => ({
				...prevGameDay!,
				status: "IN_PROGRESS" as GameDayStatus,
			}));

			await fetchGameDays();
			await fetchGamesData();

			customToast.success("Game day status reset successfully");
		} catch (error) {
			console.error("Error undoing game day completion:", error);
			customToast.error("Failed to undo game day completion");
		}
	};

	useEffect(() => {
		if (gameDay?.status === "COMPLETED") {
			const latestCompleted = gameDays
				.filter(day => day.status === "COMPLETED")
				.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0];

			setIsLatestCompleted(latestCompleted?.id === id);
		}
	}, [gameDay?.status, gameDays, id]);

	// Add this useEffect to fetch sponsorships
	useEffect(() => {
		const fetchSponsorships = async () => {
			try {
				const response = await fetch("/api/sponsorships");
				const data = await response.json();

				const sponsorMap = data.reduce(
					(acc: Record<string, string>, curr: any) => {
						if (
							curr.active &&
							(curr.duration === "LONG_TERM" || curr.gameDayId === id)
						) {
							acc[curr.playerId] = curr.sponsorName;
						}
						return acc;
					},
					{},
				);

				setPlayerSponsors(sponsorMap);
			} catch (error) {
				console.error("Failed to fetch sponsorships:", error);
			}
		};

		fetchSponsorships();
	}, [id]);

	// Update submitterName when session changes
	useEffect(() => {
		if (session?.user?.username) {
			setSubmitterName(session.user.username);
		}
	}, [session?.user?.username]);

	// if (loading) return <LoadingSpinner />;

	const formattedDate = currentGameDay
		? new Date(currentGameDay.date).toLocaleDateString()
		: "";

	const handleSponsorUpdate = (newSponsorships: Record<string, string>) => {
		setPlayerSponsors(newSponsorships);
	};

	const [totalPositiveBalance, setTotalPositiveBalance] = useState(0);

	useEffect(() => {
		const fetchBalances = async () => {
			try {
				const response = await fetch(`/api/games/${id}/playerBalances`);
				const data = await response.json();
				if (Array.isArray(data)) {
					// Sum only the positive balances
					const positiveSum = data
						.filter(player => player.balance > 0)
						.reduce((sum, player) => sum + player.balance, 0);
					setTotalPositiveBalance(positiveSum);
				}
			} catch (error) {
				console.error("Failed to fetch player balances:", error);
			}
		};

		fetchBalances();
	}, [id, games]); // Re-fetch when games change

	return (
		<main className="container mx-auto p-4 pt-10 space-y-4 relative">
			{/* Video Background - only show for non-completed games */}

			{/* Content Container */}
			<div className="flex flex-col items-center gap-4 max-w-4xl mx-auto">
				{/* Header Section */}
				<div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-pink-500/20 shadow-lg">
					<div className="flex justify-between items-center">
						{/* Only show left arrow if not viewing the latest game */}
						{currentGameDay?.id !== gameDays[0]?.id && (
							<button
								onClick={() => navigateToGameDay(-1)}
								className="p-2 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors"
							>
								<HiArrowLeft className="w-5 h-5" />
							</button>
						)}

						<div className="flex-1 flex justify-center items-center gap-2">
							<h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-center">
								Game Day:{" "}
								{loading ? (
									<LoadingContent
										width="w-24"
										height="h-8"
										className="inline-block ml-2"
									/>
								) : (
									formattedDate
								)}
							</h1>
							<button
								onClick={handleShareButtonClick}
								className="p-2 pl-0 rounded-lg text-pink-400 transition-colors"
							>
								<MdOutlineShare className="w-5 h-5" />
							</button>
						</div>

						<button
							onClick={() => navigateToGameDay(1)}
							className="p-2 rounded-lg bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 transition-colors"
						>
							<HiArrowRight className="w-5 h-5" />
						</button>
					</div>

					{/* Stats Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
						<div className="p-4 rounded-lg bg-gray-900/50 border border-pink-500/10">
							<p className="text-sm font-medium text-gray-400 text-center">
								Total Games
							</p>
							{loading ? (
								<LoadingContent
									width="w-16"
									height="h-8"
									className="mx-auto mt-1"
								/>
							) : (
								<p className="text-2xl font-bold text-gray-200 text-center">
									{games.length}
								</p>
							)}
						</div>
						<div className="p-4 rounded-lg bg-gray-900/50 border border-pink-500/10">
							<p className="text-sm font-medium text-gray-400 text-center">
								Total Players
							</p>
							{loading ? (
								<LoadingContent
									width="w-16"
									height="h-8"
									className="mx-auto mt-1"
								/>
							) : (
								<p className="text-2xl font-bold text-gray-200 text-center">
									{players.length}
								</p>
							)}
						</div>
						<div className="p-4 rounded-lg bg-gray-900/50 border border-pink-500/10">
							<p className="text-sm font-medium text-gray-400 text-center">
								Total Surrendered
							</p>
							{loading ? (
								<LoadingContent
									width="w-16"
									height="h-8"
									className="mx-auto mt-1"
								/>
							) : (
								<p className="text-2xl font-bold text-gray-200 text-center">
									{games.filter(game => game.gameType === "surrendered").length}
								</p>
							)}
						</div>
						<div className="p-4 rounded-lg bg-gray-900/50 border border-pink-500/10">
							<p className="text-sm font-medium text-gray-400 text-center">
								Total Won
							</p>
							{loading ? (
								<LoadingContent
									width="w-16"
									height="h-8"
									className="mx-auto mt-1"
								/>
							) : (
								<p className="text-2xl font-bold text-green-400 text-center">
									{(() => {
										return totalPositiveBalance;
									})()}
									¥
								</p>
							)}
						</div>
						<div className="p-4 rounded-lg bg-gray-900/50 border border-pink-500/10">
							<p className="text-sm font-medium text-gray-400 text-center">
								Biggest Winner
							</p>
							{loading ? (
								<div className="space-y-2">
									<LoadingContent
										width="w-24"
										height="h-6"
										className="mx-auto"
									/>
									<LoadingContent
										width="w-16"
										height="h-4"
										className="mx-auto"
									/>
								</div>
							) : (
								<p className="text-lg font-bold text-green-400 text-center">
									{gameDay?.biggestWinner || "--"}
									{gameDay?.biggestWinnerAmount && (
										<span className="block text-sm">
											+{gameDay.biggestWinnerAmount}¥
										</span>
									)}
								</p>
							)}
						</div>
						<div className="p-4 rounded-lg bg-gray-900/50 border border-pink-500/10">
							<p className="text-sm font-medium text-gray-400 text-center">
								Biggest Loser
							</p>
							{loading ? (
								<div className="space-y-2">
									<LoadingContent
										width="w-24"
										height="h-6"
										className="mx-auto"
									/>
									<LoadingContent
										width="w-16"
										height="h-4"
										className="mx-auto"
									/>
								</div>
							) : (
								<p className="text-lg font-bold text-red-400 text-center">
									{gameDay?.biggestLoser || "--"}
									{gameDay?.biggestLoserAmount && (
										<span className="block text-sm">
											{gameDay.biggestLoserAmount}¥
										</span>
									)}
								</p>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex justify-end items-center mt-4 gap-4">
						{gameDay?.status === "COMPLETED" ? (
							<div className="flex items-center gap-4 ml-auto">
								<div className="flex items-center gap-2 text-green-400">
									<FiCheck className="w-5 h-5" />
									<span className="font-medium">Game Day Completed</span>
								</div>
								{(userRole === "ADMIN" || userRole === "MODERATOR") &&
									isLatestCompleted && (
										<button
											onClick={handleUndoComplete}
											className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
										>
											<FaUndo className="w-4 h-4" />
											<span>Undo</span>
										</button>
									)}
							</div>
						) : (
							allPlayers.length > 0 && (
								<div className="flex gap-4 w-full md:w-auto">
									<button
										onClick={() => setIsConfirmModalOpen(true)}
										className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg disabled:from-gray-600 disabled:to-gray-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
									>
										Complete Game Day
									</button>
								</div>
							)
						)}
					</div>
				</div>

				{/* Add Game Sponsors */}
				{/* <div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-pink-500/20 shadow-lg">
					<AddGameSponsors
						allPlayers={allPlayers.map(player => player.name)}
						onSponsorUpdate={handleSponsorUpdate}
						gameDayId={id}
						gameStatus={gameDay?.status || "IN_PROGRESS"}
					/>
				</div> */}

				{gameDay?.status === "COMPLETED" ? (
					<>
						{players && players.length > 0 && gameDay && (
							<>
								<Suspense fallback={<div>Loading components...</div>}>
									<SponsorsSection games={games} />
									<PlayerBalances gameDayId={id} />
									<PaymentSummary players={players} gameDay={gameDay} />
								</Suspense>
								<GameHistoryLazy
									games={games}
									onDeleteGameAction={handleDeleteGame}
									onUpdateGamesAction={fetchGamesData}
									creatorId={gameDay?.creatorId || ""}
									gameDay={gameDay}
								/>
								<GameDayBroadcasts broadcasts={filteredBroadcasts} />
							</>
						)}
					</>
				) : (
					<>
						<Suspense fallback={<div>Loading components...</div>}>
							<GameRecorder
								onAddGame={async (...args) => {
									await handleAddGame(...args);
								}}
								gameDayGames={games}
								gameDayId={id}
								submitterName={submitterName}
								sponsorships={playerSponsors}
							/>
						</Suspense>
						<GameHistoryLazy
							games={games}
							onDeleteGameAction={handleDeleteGame}
							onUpdateGamesAction={fetchGamesData}
							creatorId={gameDay?.creatorId || ""}
							gameDay={gameDay}
						/>
						{players && players.length > 0 && gameDay && (
							<>
								<Suspense fallback={<div>Loading components...</div>}>
									<PlayerBalances
										gameDayId={id}
										refreshTrigger={refreshCounter}
									/>
									<SponsorsSection games={games} />
									<PaymentSummary
										players={players}
										gameDay={gameDay}
										refreshTrigger={refreshCounter}
									/>
								</Suspense>
							</>
						)}
					</>
				)}

				<ConfirmModal
					isOpen={isConfirmModalOpen}
					onClose={() => setIsConfirmModalOpen(false)}
					onConfirm={() => {
						handleCompleteGameDay();
						setIsConfirmModalOpen(false);
					}}
					title="Complete Game Day"
					message="Once completed, the game day will be locked and no further game records can be added or removed."
				/>
			</div>
		</main>
	);
}
