"use client";

import { useSession } from "next-auth/react";
import { Game, GameDay } from "../types";
import { GiTrophyCup } from "react-icons/gi";
import {
	FaSkullCrossbones,
	FaFlag,
	FaTrash,
	FaPencil,
	FaMap,
} from "react-icons/fa6";
import { FiCheck } from "react-icons/fi";
import { useState, useEffect, useMemo } from "react";
import Modal from "./Modal";
import { BsThreeDotsVertical } from "react-icons/bs";
import { Menu } from "@headlessui/react";
import { customToast } from "../utils/toast";
import GameEditForm from "./GameEditForm";
import { FaStar } from "react-icons/fa6";

interface GameSponsorship {
	id: string;
	playerId: string;
	sponsorName: string;
	percentage: number;
	gameId: string | null;
	active: boolean;
}

interface Props {
	games: Game[];
	onDeleteGameAction: (id: string) => Promise<void>;
	onUpdateGamesAction: () => Promise<void>;
	creatorId: string;
	gameDay: GameDay | null;
}

const getAmountGradient = (amount: number, isSurrendered: boolean) => {
	const baseGradient = (() => {
		switch (amount) {
			case 100:
				return "from-emerald-400 to-teal-500";
			case 150:
				return "from-amber-400 to-orange-500";
			case 200:
				return "from-red-400 to-rose-500";
			default:
				return "from-purple-500 to-pink-500";
		}
	})();

	return isSurrendered ? `${baseGradient} opacity-50` : baseGradient;
};

export default function GameHistory({
	games,
	onDeleteGameAction,
	onUpdateGamesAction,
	creatorId,
	gameDay,
}: Props) {
	const { data: session } = useSession();
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [gameIdToDelete, setGameIdToDelete] = useState<string | null>(null);
	const [selectedPlayer, setSelectedPlayer] = useState<string>("");
	const [userRole, setUserRole] = useState<string | null>(null);
	const [userRoles, setUserRoles] = useState<Record<string, string>>({});
	const [openMenuId, setOpenMenuId] = useState<string | null>(null);
	const [editingGameId, setEditingGameId] = useState<string | null>(null);
	const [allPlayers, setAllPlayers] = useState<string[]>([]);
	const [editingSponsorsGame, setEditingSponsorsGame] = useState<Game | null>(
		null,
	);
	const [sponsorEdits, setSponsorEdits] = useState<Record<string, string>>({});
	const [sponsorEditLoading, setSponsorEditLoading] = useState(false);

	// Get unique player names from all games
	const uniquePlayers = Array.from(
		new Set(games.flatMap(game => [...game.winners, ...game.losers])),
	).sort();

	// Memoize unique creators to prevent infinite re-renders
	const uniqueCreators = useMemo(
		() => Array.from(new Set(games.map(game => game.createdBy))),
		[games],
	);

	const getUsernameColor = (username: string) => {
		const role = userRoles[username];
		switch (role) {
			case "ADMIN":
				return "text-yellow-400";
			case "MODERATOR":
				return "text-purple-400";
			default:
				return "text-gray-400";
		}
	};

	// Fetch roles for all creators
	useEffect(() => {
		let isMounted = true;

		const fetchCreatorRoles = async () => {
			try {
				const roles: Record<string, string> = {};
				for (const game of games) {
					if (game.createdById) {
						const roleResponse = await fetch(
							`/api/users/role?id=${game.createdById}`,
							{
								credentials: "include",
							},
						);
						if (roleResponse.ok && isMounted) {
							const roleData = await roleResponse.json();
							roles[game.createdBy] = roleData.role;
						}
					}
				}
				if (isMounted) {
					setUserRoles(roles);
				}
			} catch (error) {
				console.error("Failed to fetch creator roles:", error);
			}
		};

		fetchCreatorRoles();

		return () => {
			isMounted = false;
		};
	}, [games]);

	// Filter games based on selected player
	const filteredGames = selectedPlayer
		? games.filter(
				game =>
					game.winners.includes(selectedPlayer) ||
					game.losers.includes(selectedPlayer),
		  )
		: games;

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
					}
				} catch (error) {
					console.error("Failed to load user role:", error);
				}
			}
		};

		loadUserRole();
	}, [session?.user?.username]);

	// Modify the click outside handler to be more specific
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as HTMLElement;
			if (!target.closest(".menu-container")) {
				setOpenMenuId(null);
			}
		};
		document.addEventListener("click", handleClickOutside);
		return () => document.removeEventListener("click", handleClickOutside);
	}, []);

	// Add useEffect to fetch all players
	useEffect(() => {
		const fetchAllPlayers = async () => {
			try {
				const response = await fetch("/api/players");
				const data = await response.json();
				const playerNames = data.map((player: { name: string }) => player.name);
				setAllPlayers(playerNames.sort());
			} catch (error) {
				console.error("Failed to fetch players:", error);
				customToast.error("Failed to load players");
			}
		};

		fetchAllPlayers();
	}, []);

	const handleDeleteGame = async () => {
		if (!gameIdToDelete) return;
		await onDeleteGameAction(gameIdToDelete as string);
		setIsDeleteModalOpen(false);
		setGameIdToDelete(null);
	};

	const handleEditClick = (id: string) => {
		setEditingGameId(id);
	};

	const handleEditSponsorsClick = (game: Game) => {
		setEditingSponsorsGame(game);
		// Initialize sponsorEdits with current sponsorships
		const initial: Record<string, string> = {};
		game.sponsorships?.forEach(s => {
			if (s.active && s.player) {
				initial[s.player.name] = s.sponsorName;
			}
		});
		setSponsorEdits(initial);
	};

	const handleSponsorEditChange = (playerName: string, sponsorName: string) => {
		setSponsorEdits(prev => ({ ...prev, [playerName]: sponsorName }));
	};

	const handleSaveSponsors = async () => {
		if (!editingSponsorsGame) return;
		setSponsorEditLoading(true);
		try {
			const response = await fetch(
				`/api/games/sponsorships?id=${editingSponsorsGame.id}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ sponsorships: sponsorEdits }),
				},
			);
			if (!response.ok) throw new Error("Failed to update sponsors");
			await onUpdateGamesAction();
			setEditingSponsorsGame(null);
			setSponsorEdits({});
		} catch (error) {
			console.error("Failed to update sponsors:", error);
		} finally {
			setSponsorEditLoading(false);
		}
	};

	const handleSaveEdit = async (
		winners: string[],
		losers: string[],
		gameType: "full" | "surrendered",
		amount: number,
		sponsorships: Record<string, string>,
		map: string | null,
	) => {
		try {
			console.log("Saving with map:", map);
			const response = await fetch(`/api/games?id=${editingGameId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					winners,
					losers,
					gameDayId: gameDay?.id,
					gameType,
					amount,
					sponsorships,
					map,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update game");
			}

			const updatedGame = await response.json();
			await onUpdateGamesAction();
			setEditingGameId(null);
			customToast.success("Game updated successfully");
		} catch (error) {
			console.error("Error updating game:", error);
			customToast.error("Failed to update game");
		}
	};

	return (
		<div className="w-full mt-8">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
					Game History
				</h2>
				<select
					value={selectedPlayer}
					onChange={e => setSelectedPlayer(e.target.value)}
					className="px-4 py-2 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-purple-500/10 text-gray-200 outline-none focus:border-purple-500/30 transition-all duration-300 hover:border-purple-500/20 [&>option]:bg-gray-900"
				>
					<option value="">All Players</option>  
					{uniquePlayers.map((player, idx) => (
						<option key={`${player}-${idx}`} value={player}>
							{player}
						</option>
					))}
				</select>
			</div>
			<div className="space-y-4 overflow-y-auto z-100">
				{filteredGames.map((game, index) => (
					<div
						key={`${game.id}-${index}`}
						className="group relative overflow-hidden"
					>
						{(userRole === "ADMIN" ||
							userRole === "MODERATOR" ||
							game.createdBy === session?.user?.username) && (
							<Menu as="div" className="absolute top-4 right-4 z-10">
								<Menu.Button className="p-1 hover:bg-gray-700/50 rounded-full transition-colors duration-200">
									<BsThreeDotsVertical className="w-5 h-5 text-gray-400 hover:text-gray-200" />
								</Menu.Button>

								<Menu.Items className="absolute right-0 mt-1 overflow-y-auto w-28 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-100">
									<Menu.Item>
										{({ active }) => (
											<button
												onClick={() => handleEditClick(game.id)}
												className={`${
													active ? "bg-gray-700" : ""
												} w-full px-4 py-2 text-sm text-gray-200 text-left flex items-center gap-2 rounded-md`}
											>
												Edit <FaPencil className="w-3.5 h-3.5" />
											</button>
										)}
									</Menu.Item>
									{/* <Menu.Item>
										{({ active }) => (
											<button
												onClick={() => handleEditSponsorsClick(game)}
												className={`${
													active ? "bg-gray-700" : ""
												} w-full px-4 py-2 text-sm text-yellow-400 text-left flex items-center gap-2 rounded-md`}
											>
												Edit Sponsors <FaStar className="w-3.5 h-3.5" />
											</button>
										)}
									</Menu.Item> */}
									<Menu.Item>
										{({ active }) => (
											<button
												onClick={() => {
													setGameIdToDelete(game.id);
													setIsDeleteModalOpen(true);
												}}
												className={`${
													active ? "bg-gray-700" : ""
												} w-full px-4 py-2 text-sm text-red-400 text-left flex items-center gap-2 rounded-md`}
											>
												Delete <FaTrash className="w-3.5 h-3.5" />
											</button>
										)}
									</Menu.Item>
								</Menu.Items>
							</Menu>
						)}
						<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

						<div
							className={`relative p-4 md:p-6 rounded-xl backdrop-blur-sm border flex w-full items-center
							${
								game.gameType === "surrendered"
									? "backdrop-blur-sm bg-gradient-to-r from-gray-800/90 via-gray-700/90 to-gray-800/90 border-white/40 group-hover:border-white/60 before:absolute before:inset-0 before:bg-white/[0.05] before:rounded-xl"
									: "backdrop-blur-sm bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-purple-500/20 group-hover:border-purple-500/40"
							} transition-all duration-300 ${
								index === 0 ? "animate-newGame" : ""
							}`}
						>
							{editingGameId !== game.id && game.amount !== 50 && (
								<div
									className={`absolute flex items-center justify-center bottom-3 right-6 h-7 w-10 rounded-lg bg-gradient-to-r ${getAmountGradient(
										game.amount,
										game.gameType === "surrendered",
									)} text-white text-sm font-bold shadow-lg`}
								>
									¥
									{game.gameType === "surrendered"
										? game.amount / 2
										: game.amount || 50}
								</div>
							)}
							{/* Left Section - Game Info */}
							<div
								className={`min-w-[115px] md:min-w-[180px] w-[120px] md:w-[180px] relative ${
									editingGameId === game.id ? "hidden" : ""
								}`}
							>
								<div className="flex items-center gap-1.5 text-gray-200 font-bold mb-2">
									<div className="w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
										{filteredGames.length - index}
									</div>
									{game.gameType === "surrendered" ? (
										<div className="flex items-center gap-1">
											<FaFlag className="w-4 h-4 text-white" />
										</div>
									) : (
										<FiCheck className="w-5 h-5 text-green-400" />
									)}
								</div>

								<div className="space-y-0.5 text-sm">
									<div className="text-gray-400 truncate">
										Added by:{" "}
										<span
											className={
												userRoles[game.createdBy] === "ADMIN"
													? "text-yellow-400"
													: userRoles[game.createdBy] === "MODERATOR"
													? "text-purple-400"
													: "text-gray-400"
											}
										>
											{game.createdBy}
										</span>
									</div>
									<div className="text-gray-400">
										{new Date(game.createdAt).toLocaleString(undefined, {
											hour: "2-digit",
											minute: "2-digit",
										})}
									</div>
									<div className="text-gray-400 truncate">
										Map:{" "}
										<span className="text-purple-400">
											{game.map?.trim() || "not given"}
										</span>
									</div>
								</div>
							</div>
							{/* Right Section - Winners & Losers */}
							<div className="flex-1 min-w-0 space-y-2 ml-0 md:ml-8 relative">
								{editingGameId === game.id ? (
									<GameEditForm
										game={game}
										onSave={(
											winners,
											losers,
											gameType,
											amount,
											sponsorships,
											map,
										) =>
											handleSaveEdit(
												winners,
												losers,
												gameType,
												amount,
												sponsorships,
												map,
											)
										}
										onCancel={() => setEditingGameId(null)}
										allPlayers={allPlayers}
									/>
								) : (
									<div className="-ml-3">
										<div className="flex items-center gap-1">
											<GiTrophyCup className="w-5 h-5 text-yellow-400 shrink-0" />
											<div className="text-green-400 font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
												{game.winners.map((winner, idx) => {
													const sponsorship = game.sponsorships?.find(
														s => s.player?.name === winner && s.active,
													);
													return (
														<span key={`${game.id}-winner-${winner}-${idx}`}>
															{winner}
															{sponsorship && (
																<span className="text-yellow-500 text-sm ml-1">
																	({sponsorship.sponsorName})
																</span>
															)}
															{idx < game.winners.length - 1 ? ", " : ""}
														</span>
													);
												})}
											</div>
										</div>
										<div className="flex items-center gap-1">
											<FaSkullCrossbones className="w-5 h-5 text-red-400 shrink-0" />
											<div className="text-red-400 font-bold overflow-x-auto whitespace-nowrap scrollbar-hide">
												{game.losers.map((loser, idx) => {
													const sponsorship = game.sponsorships?.find(
														s => s.player?.name === loser && s.active,
													);
													return (
														<span key={`${game.id}-loser-${loser}-${idx}`}>
															{loser}
															{sponsorship && (
																<span className="text-yellow-500 text-sm ml-1">
																	({sponsorship.sponsorName})
																</span>
															)}
															{idx < game.losers.length - 1 ? ", " : ""}
														</span>
													);
												})}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Delete Confirmation Modal */}
			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setGameIdToDelete(null);
				}}
				title="Delete Game"
			>
				<div className="p-4">
					<p className="text-gray-200 mb-4">
						Are you sure you want to delete this game?
					</p>
					<div className="flex justify-end gap-2">
						<button
							onClick={() => {
								setIsDeleteModalOpen(false);
								setGameIdToDelete(null);
							}}
							className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
						>
							Cancel
						</button>
						<button
							onClick={handleDeleteGame}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
						>
							Delete
						</button>
					</div>
				</div>
			</Modal>

			{/* Edit Sponsors Modal */}
			<Modal
				isOpen={!!editingSponsorsGame}
				onClose={() => {
					setEditingSponsorsGame(null);
					setSponsorEdits({});
				}}
				title="Edit Sponsors"
			>
				{editingSponsorsGame && (
					<div className="space-y-3 p-2">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							{/* Winners Column */}
							<div className="space-y-1.5 md:border-r border-purple-500/10 pr-6">
								<h4 className="text-green-400 font-medium mb-2">Winners</h4>
								{editingSponsorsGame.winners.map(player => (
									<div key={player} className="flex items-center gap-2">
										<span className="text-gray-300 min-w-[80px] truncate">
											{player}
										</span>
										<span className="text-gray-500">→</span>
										<select
											value={sponsorEdits[player] || ""}
											onChange={e =>
												handleSponsorEditChange(player, e.target.value)
											}
											className={`w-3/4 px-2 py-0.5 rounded-lg bg-gray-800/50 border border-purple-500/10 outline-none focus:border-purple-500/30
												${sponsorEdits[player] ? "text-yellow-500" : "text-gray-200"}`}
										>
											<option value="" className="text-gray-200">
												Select Sponsor
											</option>
											{allPlayers.map((sponsor, idx) => (
												<option
													key={`${sponsor}-${idx}`}
													value={sponsor}
													className={
														sponsorEdits[player] === sponsor
															? "text-yellow-500"
															: "text-gray-200"
													}
												>
													Sponsored by: {sponsor}
												</option>
											))}
										</select>
									</div>
								))}
							</div>
							{/* Losers Column */}
							<div className="space-y-1.5 md:pl-2 pr-6">
								<h4 className="text-red-400 font-medium mb-2">Losers</h4>
								{editingSponsorsGame.losers.map(player => (
									<div key={player} className="flex items-center gap-2">
										<span className="text-gray-300 min-w-[80px] truncate">
											{player}
										</span>
										<span className="text-gray-500">→</span>
										<select
											value={sponsorEdits[player] || ""}
											onChange={e =>
												handleSponsorEditChange(player, e.target.value)
											}
											className={`w-3/4 px-2 py-0.5 rounded-lg bg-gray-800/50 border border-purple-500/10 outline-none focus:border-purple-500/30
												${sponsorEdits[player] ? "text-yellow-500" : "text-gray-200"}`}
										>
											<option value="" className="text-gray-200">
												Select Sponsor
											</option>
											{allPlayers.map((sponsor, idx) => (
												<option
													key={`${sponsor}-${idx}`}
													value={sponsor}
													className={
														sponsorEdits[player] === sponsor
															? "text-yellow-500"
															: "text-gray-200"
													}
												>
													Sponsored by: {sponsor}
												</option>
											))}
										</select>
									</div>
								))}
							</div>
						</div>
						<div className="flex justify-end gap-2 mt-4">
							<button
								onClick={() => {
									setEditingSponsorsGame(null);
									setSponsorEdits({});
								}}
								className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
								disabled={sponsorEditLoading}
							>
								Cancel
							</button>
							<button
								onClick={handleSaveSponsors}
								className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
								disabled={sponsorEditLoading}
							>
								{sponsorEditLoading ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
