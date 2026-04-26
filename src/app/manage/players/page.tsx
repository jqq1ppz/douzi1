"use client";

import { useState, useEffect } from "react";
import { FaEdit, FaTrash, FaUserPlus, FaCheck, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/ConfirmModal";
import AddPlayerModal from "../../components/AddPlayerModal";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Link from "next/link";
import { customToast } from "../../utils/toast";

interface Player {
	id: string;
	name: string;
	active: boolean;
	createdAt: Date;
	lastGameDate: Date | null;
	totalGames: number;
	winCount: number;
	loseCount: number;
	winRate: number;
}

export default function ManagePlayers() {
	const [players, setPlayers] = useState<Player[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [deleteModal, setDeleteModal] = useState<{
		isOpen: boolean;
		player: Player | null;
		password: string;
		error: string;
	}>({
		isOpen: false,
		player: null,
		password: "",
		error: "",
	});
	const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

	useEffect(() => {
		fetchPlayers();
	}, []);

	const fetchPlayers = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/api/players/stats");
			const data = await response.json();
			setPlayers(data);
		} catch (error) {
			console.error("Error fetching players:", error);
			toast.error("Failed to fetch players");
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdatePlayer = async (oldName: string) => {
		try {
			const response = await fetch(`/api/players/update`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ oldName: oldName, newName: editName.trim() }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to update player");
			}

			toast.success(`Updated ${oldName} to ${editName}`);
			setEditingPlayer(null);
			setEditName("");
			fetchPlayers();
		} catch (error) {
			toast.error("Failed to update player");
			console.error(error);
		}
	};

	const handleDelete = async (player: Player) => {
		if (deleteModal.password !== "douzi") {
			setDeleteModal(prev => ({ ...prev, error: "Incorrect password" }));
			return;
		}

		try {
			const response = await fetch(`/api/players/${player.id}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error("Failed to delete player");

			customToast.success(`Deleted ${player.name}`);
			fetchPlayers();
			setDeleteModal({ isOpen: false, player: null, password: "", error: "" });
		} catch {
			toast.error("Failed to delete player");
		}
	};

	const handleAddPlayer = () => {
		fetchPlayers();
	};

	const getRelativeTime = (date: Date | null) => {
		if (!date) return "No game played";

		const now = new Date();
		const gameDate = new Date(date);
		const diffTime = Math.abs(now.getTime() - gameDate.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return "Today";
		} else if (diffDays === 1) {
			return "Yesterday";
		} else if (diffDays < 7) {
			return `${diffDays} days ago`;
		} else if (diffDays < 30) {
			const weeks = Math.floor(diffDays / 7);
			return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
		} else {
			const months = Math.floor(diffDays / 30);
			return `${months} ${months === 1 ? "month" : "months"} ago`;
		}
	};

	return (
		<div className="flex flex-col min-h-screen pb-16">
			<div className="flex-grow container mx-auto p-4 pt-10 space-y-8">
				{/* Header Section */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
						Manage Players
					</h1>
					<p className="text-gray-400 mt-2">Add or update player information</p>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center h-64">
						<LoadingSpinner />
					</div>
				) : (
					<div className="max-w-3xl mx-auto">
						{/* Add Player Button */}
						<div className="flex justify-end mb-6">
							<button
								onClick={() => setIsAddPlayerModalOpen(true)}
								className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
							>
								<FaUserPlus className="w-4 h-4" />
								Add Player
							</button>
						</div>

						{/* Players List */}
						<div className="space-y-4">
							{players.map(player => (
								<div
									key={player.id}
									className="p-6 border border-purple-500/20 rounded-xl bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-200 group"
								>
									<div className="flex items-center justify-between">
										{editingPlayer === player.id ? (
											<div className="flex-1 flex items-center gap-4">
												<input
													type="text"
													value={editName}
													onChange={e => setEditName(e.target.value)}
													className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-purple-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
													placeholder="Enter new name"
												/>
												<div className="flex gap-2">
													<button
														onClick={() => handleUpdatePlayer(player.name)}
														className="p-2 text-green-400 hover:text-green-300 transition-colors"
													>
														<FaCheck className="w-4 h-4" />
													</button>
													<button
														onClick={() => {
															setEditingPlayer(null);
															setEditName("");
														}}
														className="p-2 text-red-400 hover:text-red-300 transition-colors"
													>
														<FaTimes className="w-4 h-4" />
													</button>
												</div>
											</div>
										) : (
											<>
												<div className="flex flex-col">
													<Link
														href={`/players?name=${encodeURIComponent(
															player.name,
														)}`}
														className="text-lg font-medium text-white group-hover:text-purple-400 transition-colors hover:underline"
													>
														{player.name}
													</Link>
													<div className="mt-2 space-y-1">
														<span className="text-sm text-gray-400 block">
															Was Added:{" "}
															{new Date(player.createdAt).toLocaleDateString()}
														</span>
														{player.lastGameDate && (
															<span className="text-sm text-gray-400 block">
																Last played:{" "}
																{new Date(
																	player.lastGameDate,
																).toLocaleDateString()}{" "}
																({getRelativeTime(player.lastGameDate)})
															</span>
														)}
														<div className="flex gap-4 text-sm">
															<span className="text-gray-400">
																Games:{" "}
																<span className="text-white">
																	{player.totalGames}
																</span>
															</span>
															<span className="text-gray-400">
																Win Rate:{" "}
																<span
																	className={`${
																		player.winRate >= 50
																			? "text-green-400"
																			: "text-red-400"
																	}`}
																>
																	{player.winRate.toFixed(1)}%
																</span>
															</span>
														</div>
														<div className="flex gap-4 text-sm">
															<span className="text-gray-400">
																Wins:{" "}
																<span className="text-green-400">
																	{player.winCount}
																</span>
															</span>
															<span className="text-gray-400">
																Losses:{" "}
																<span className="text-red-400">
																	{player.loseCount}
																</span>
															</span>
														</div>
													</div>
												</div>
												<div className="flex gap-3">
													<button
														onClick={() => {
															setEditingPlayer(player.id);
															setEditName(player.name);
														}}
														className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/10"
													>
														<FaEdit className="w-4 h-4" />
													</button>
													<button
														onClick={() =>
															setDeleteModal({
																isOpen: true,
																player,
																password: "",
																error: "",
															})
														}
														className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10"
													>
														<FaTrash className="w-4 h-4" />
													</button>
												</div>
											</>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Existing Modals */}
			<ConfirmModal
				isOpen={deleteModal.isOpen}
				onClose={() =>
					setDeleteModal({
						isOpen: false,
						player: null,
						password: "",
						error: "",
					})
				}
				onConfirm={() => deleteModal.player && handleDelete(deleteModal.player)}
				title="Delete Player"
				message={
					<div className="space-y-4">
						<div className="text-center">
							Are you sure you want to delete {deleteModal.player?.name}? This
							action cannot be undone.
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								Enter password to confirm
							</label>
							<input
								type="password"
								value={deleteModal.password}
								onChange={e =>
									setDeleteModal(prev => ({
										...prev,
										password: e.target.value,
										error: "",
									}))
								}
								className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
								placeholder="Enter password"
							/>
							{deleteModal.error && (
								<p className="text-red-500 text-sm mt-1">{deleteModal.error}</p>
							)}
						</div>
					</div>
				}
				confirmText="Delete"
				confirmButtonClass={`bg-red-500 hover:bg-red-600 ${
					!deleteModal.password ? "opacity-50 cursor-not-allowed" : ""
				}`}
				isConfirmDisabled={!deleteModal.password}
			/>

			<AddPlayerModal
				isOpen={isAddPlayerModalOpen}
				onClose={() => setIsAddPlayerModalOpen(false)}
				onAdd={handleAddPlayer}
				title="Add Player"
			/>
		</div>
	);
}
