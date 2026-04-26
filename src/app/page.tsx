"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { GameDay } from "./types";
import Modal from "./components/Modal";
import { useSession } from "next-auth/react";
import {
	FaChevronLeft,
	FaChevronRight,
	FaDiceD20,
	FaTrophy,
	FaCalendarAlt,
	FaFilter,
	FaUser,
	FaGamepad,
} from "react-icons/fa";
import LoadingSpinner from "./components/LoadingSpinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaUserGroup } from "react-icons/fa6";
import { customToast } from "./utils/toast";
import { motion } from "framer-motion";
import GameCardSkeleton from "./components/GameCardSkeleton";
import ActiveGameCardSkeleton from "./components/ActiveGameCardSkeleton";
import CompletedGameCardSkeleton from "./components/CompletedGameCardSkeleton";

export default function Home() {
	const router = useRouter();
	const { data: session } = useSession();
	const [gameDays, setGameDays] = useState<GameDay[]>([]);
	const [loading, setLoading] = useState(true);

	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const ITEMS_PER_PAGE = 7;
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [deletePassword, setDeletePassword] = useState("");
	const [gameIdToDelete, setGameIdToDelete] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState("");
	const [dateFilter, setDateFilter] = useState<Date | null>(null);

	useEffect(() => {
		fetchGameDays();
	}, []);

	const calculateTotalWon = (day: GameDay) => {
		const finalBalances = new Map<string, number>();
		day.games?.forEach(game => {
			const points = game.gameType === "full" ? game.amount : game.amount / 2;
			game.winners.forEach(winner => {
				finalBalances.set(winner, (finalBalances.get(winner) || 0) + points);
			});
			game.losers.forEach(loser => {
				finalBalances.set(loser, (finalBalances.get(loser) || 0) - points);
			});
		});
		return Array.from(finalBalances.values())
			.filter(balance => balance > 0)
			.reduce((sum, balance) => sum + balance, 0);
	};

	const fetchGameDays = async () => {
		setLoading(true);
		try {
			const loadingStartTime = Date.now();

			const response = await fetch("/api/gamedays");
			const data = await response.json();

			// API can return an error object instead of an array.
			if (!response.ok || !Array.isArray(data)) {
				setGameDays([]);
				setTotalPages(1);
				return;
			}

			const loadingDuration = Date.now() - loadingStartTime;

			if (loadingDuration < 500) {
				await new Promise(resolve =>
					setTimeout(resolve, 500 - loadingDuration),
				);
			}

			// Add totalWon property to each game day
			const enrichedData = data.map((day: GameDay) => ({
				...day,
				totalWon: calculateTotalWon(day),
			}));

			// Use enrichedData instead of data for the rest
			console.log("Fetched game days:", enrichedData);
			setGameDays(enrichedData);

			// Filter completed games first
			const completedGames = enrichedData.filter(
				(day: GameDay) => day.status === "COMPLETED",
			);
			setTotalPages(Math.ceil(completedGames.length / ITEMS_PER_PAGE));
		} catch (error) {
			console.error("Error fetching game days:", error);
		} finally {
			setLoading(false);
		}
	};

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

	const handleDeleteClick = (id: string, e: React.MouseEvent) => {
		e.preventDefault();
		setGameIdToDelete(id);
		setDeletePassword("");
		setDeleteError("");
		setIsDeleteModalOpen(true);
	};

	const handleDeleteGameDay = async () => {
		if (deletePassword !== "delete") {
			setDeleteError("Incorrect password");
			return;
		}

		try {
			const response = await fetch(`/api/gamedays?id=${gameIdToDelete}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const error = await response.json();
				console.error("Server error:", error);
				throw new Error("Failed to delete game day");
			}

			// Remove the deleted game day from state
			setGameDays(prev => prev.filter(day => day.id !== gameIdToDelete));
			setIsDeleteModalOpen(false);
			setGameIdToDelete(null);
			setDeletePassword("");
			setDeleteError("");
		} catch (error) {
			console.error("Error deleting game day:", error);
			setDeleteError("Failed to delete game day");
		}
	};

	const getPaginatedCompletedGames = () => {
		const completedGames = gameDays.filter(day => {
			const isCompleted = day.status === "COMPLETED";
			if (!dateFilter) return isCompleted;

			const gameDate = new Date(day.date);
			const filterDate = new Date(dateFilter);
			return (
				isCompleted &&
				gameDate.getFullYear() === filterDate.getFullYear() &&
				gameDate.getMonth() === filterDate.getMonth() &&
				gameDate.getDate() === filterDate.getDate()
			);
		});

		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return completedGames.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	};

	// if (loading) {
	// 	return <LoadingSpinner />;
	// }

	const totalGames = gameDays.length;

	const totalRounds = gameDays.reduce((sum, day) => {
		return sum + (day.games?.length || 0);
	}, 0);

	// const completedGames = gameDays.filter(day => day.status === "COMPLETED");
	const activeGames = gameDays.filter(day => day.status !== "COMPLETED");

	return (
		<main className="container mx-auto p-4 pt-10 space-y-4">
			{/* Stats Section with Gaming Theme */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="max-w-sm mx-auto mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border border-purple-500/30"
			>
				<div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 p-4">
					<div className="grid grid-cols-2 gap-4 text-center">
						<div className="p-3 rounded-lg bg-gray-800/50 backdrop-blur-sm">
							<p className="text-xs text-purple-400 uppercase tracking-wider">
								Total Games Days
							</p>
							<p className="text-2xl font-bold text-white mt-1">{totalGames}</p>
						</div>
						<div className="p-3 rounded-lg bg-gray-800/50 backdrop-blur-sm">
							<p className="text-xs text-pink-400 uppercase tracking-wider">
								Total Rounds
							</p>
							<p className="text-2xl font-bold text-white mt-1">
								{totalRounds}
							</p>
						</div>
						{process.env.NEXT_PUBLIC_SHOW_CASH === "true" && (
							<div className="col-span-2 p-3 rounded-lg bg-gray-800/50 backdrop-blur-sm mt-3">
								<p className="text-xs text-red-400 uppercase tracking-wider ">
									Total Won
								</p>

								<p className="text-2xl font-bold text-green-400 text-center">
									{gameDays.reduce((total, day) => total + day.totalWon, 0)}¥
								</p>
							</div>
						)}
					</div>
				</div>
			</motion.div>

			{/* Create Game Button */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className="flex justify-center py-6"
			>
				<button
					onClick={handleCreateGameDay}
					className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:shadow-purple-500/25"
				>
					<span className="flex items-center gap-2">
						<FaDiceD20 className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
						Create New Game Day
					</span>
				</button>
			</motion.div>

			{/* Active Games Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.4 }}
				className="space-y-8"
			>
				<h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 flex items-center gap-2">
					<FaDiceD20 className="w-6 h-6 text-purple-500" />
					Active Games
				</h2>
				<div className="flex flex-col gap-6">
					{loading ? (
						<ActiveGameCardSkeleton />
					) : (
						activeGames.map((day, index) => (
							<motion.div
								key={day.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, delay: index * 0.1 }}
							>
								<Link href={`/game/${day.id}`}>
									<div className="p-6 border-2 border-purple-500/40 rounded-xl bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20 group animate-pulse-subtle relative overflow-hidden hover:scale-[1.02]">
										{/* Animated gradient background */}
										<div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-gradient-x"></div>

										<div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="md:col-span-3">
												<div className="flex flex-col md:grid md:grid-cols-3 gap-x-4 gap-y-2">
													{/* Left Side - 2/3 width */}
													<div className="md:col-span-2">
														{/* Row 1 - Date and Status */}
														<div className="flex items-center gap-3">
															<h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
																{new Date(day.date).toLocaleDateString()}
															</h3>
															<span
																className={`px-2 py-0.5 rounded text-base ${
																	day.status === "NOT_STARTED" ||
																	!day.games?.length
																		? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100"
																		: "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
																}`}
															>
																{day.status === "NOT_STARTED" ||
																!day.games?.length
																	? "Not Started"
																	: "In Progress"}
															</span>
														</div>

														{/* Row 2 - Stats */}
														<div className="flex items-center gap-4 text-base mt-2">
															<div className="flex items-center gap-1 text-gray-300">
																<span className="text-pink-400">
																	<FaGamepad className="w-6 h-6" />
																</span>{" "}
																<span className="group-hover:text-purple-300 transition-colors">
																	{day.games?.length || 0} Rounds
																</span>
															</div>
															<div className="text-gray-300 flex items-center gap-1">
																<FaUserGroup className="inline w-4 h-4 text-pink-400" />{" "}
																<span className="group-hover:text-purple-300 transition-colors">
																	{
																		new Set([
																			...(day.games?.flatMap(game => [
																				...game.winners,
																				...game.losers,
																			]) || []),
																		]).size
																	}{" "}
																	Players
																</span>
															</div>
														</div>
													</div>

													{/* Right Side - 1/3 width */}
													<div className="text-right font-bold">
														{day.games?.length > 0 && (
															<div className="text-base">
																<p className="text-green-300 flex items-center justify-end gap-2">
																	<span className="text-purple-400">🏆</span>
																	<span className="font-medium">
																		{day.biggestWinner || "N/A"}
																	</span>
																	{day.biggestWinnerAmount && (
																		<span>+{day.biggestWinnerAmount}</span>
																	)}
																</p>
																<p className="text-red-300 flex items-center justify-end gap-2">
																	<span className="text-purple-400">💀</span>
																	<span className="font-medium">
																		{day.biggestLoser || "N/A"}
																	</span>
																	{day.biggestLoserAmount && (
																		<span>{day.biggestLoserAmount}</span>
																	)}
																</p>
															</div>
														)}
														{day.games?.length > 0 ? (
															<p className="text-green-300 font-bold flex items-center justify-end gap-2 text-base">
																<span className="sm:inline">Total Won:</span>
																<span className="font-bold">
																	{day.totalWon}¥
																</span>
															</p>
														) : (
															<p className="text-gray-400 text-base">
																No games yet
															</p>
														)}
													</div>
												</div>
											</div>

											{/* Admin Delete Button */}
											{session?.user?.username === "admin" && (
												<div className="md:col-span-3 flex md:justify-end">
													<button
														onClick={e => handleDeleteClick(day.id, e)}
														className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium"
													>
														Delete
													</button>
												</div>
											)}
										</div>
									</div>
								</Link>
							</motion.div>
						))
					)}
				</div>
			</motion.div>

			{/* Completed Games Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.6 }}
				className="space-y-8 mt-8"
			>
				<div className="flex items-center gap-4">
					<h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 flex items-center gap-2">
						<FaTrophy className="w-6 h-6 text-purple-500" />
						Completed Games
					</h2>
					<div className="relative flex items-center gap-2">
						<FaFilter className="w-3 h-3 text-white-400" />
						<div className="flex items-center gap-1">
							<DatePicker
								selected={dateFilter}
								onChange={(date: Date | null) => setDateFilter(date)}
								dateFormat="MM/dd/yyyy"
								isClearable={false}
								maxDate={
									new Date(
										new Date().toLocaleString("en-US", {
											timeZone: "America/New_York",
										}),
									)
								}
								minDate={
									new Date(
										new Date("2025-01-07").toLocaleString("en-US", {
											timeZone: "America/New_York",
										}),
									)
								}
								excludeDates={[...Array(365)].map((_, i) => {
									const date = new Date(
										new Date().toLocaleString("en-US", {
											timeZone: "America/New_York",
										}),
									);
									date.setDate(date.getDate() + i + 1);
									return date;
								})}
								showMonthDropdown={false}
								showYearDropdown={false}
								customInput={
									<button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-purple-400 transition-colors">
										<FaCalendarAlt className="w-5 h-5" />
									</button>
								}
								className="bg-gray-800 text-white rounded-lg border border-purple-500/20"
							/>
							{dateFilter && (
								<button
									onClick={() => setDateFilter(null)}
									className="text-purple-400 hover:text-purple-300 text-sm"
								>
									Clear
								</button>
							)}
						</div>
					</div>
				</div>
				<div className="flex flex-col gap-6">
					{loading ? (
						<>
							<CompletedGameCardSkeleton />
							<CompletedGameCardSkeleton />
							<CompletedGameCardSkeleton />
						</>
					) : (
						getPaginatedCompletedGames().map((day, index) => (
							<motion.div
								key={day.id}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.3, delay: index * 0.1 }}
							>
								<Link href={`/game/${day.id}`}>
									<div className="p-6 border border-purple-500/20 rounded-xl bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10 group">
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="md:col-span-3">
												<div className="flex flex-col md:grid md:grid-cols-3 gap-x-4 gap-y-2">
													{/* Left Side - 2/3 width */}
													<div className="md:col-span-2">
														{/* Row 1 - Date and Status */}
														<div className="flex items-center gap-3">
															<h3 className="text-xl font-bold text-white">
																{new Date(day.date).toLocaleDateString()}
															</h3>
															<span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-0.5 rounded text-base">
																Completed
															</span>
														</div>

														{/* Row 2 - Stats */}
														<div className="flex items-center gap-4 text-base mt-2">
															<div className="text-gray-400 flex items-center gap-1">
																<span className="text-purple-400">
																	<FaGamepad className="w-6 h-6" />
																</span>{" "}
																{day.games?.length || 0} Rounds
															</div>
															<div className="text-gray-400 flex items-center gap-1">
																<FaUserGroup className="inline w-4 h-4 text-purple-400" />{" "}
																{
																	new Set([
																		...(day.games?.flatMap(game => [
																			...game.winners,
																			...game.losers,
																		]) || []),
																	]).size
																}{" "}
																Players
															</div>
														</div>
													</div>

													{/* Right Side - 1/3 width */}
													<div className="text-right font-bold">
														{/* Row 2 - Winners/Losers */}
														{day.games?.length > 0 && (
															<div className="justify-end text-base">
																<p className="text-green-400 flex justify-end items-center gap-2">
																	<span className="text-purple-400">🏆</span>
																	<span className="font-medium">
																		{day.biggestWinner || "N/A"}
																	</span>
																	{day.biggestWinnerAmount && (
																		<span>+{day.biggestWinnerAmount}</span>
																	)}
																</p>
																<p className="text-red-400 flex justify-end items-center gap-2">
																	<span className="text-purple-400">💀</span>
																	<span className="font-medium">
																		{day.biggestLoser || "N/A"}
																	</span>
																	{day.biggestLoserAmount && (
																		<span>{day.biggestLoserAmount}</span>
																	)}
																</p>
															</div>
														)}
														{day.games?.length > 0 ? (
															<p className="text-green-300 font-bold flex items-center justify-end gap-2 text-base">
																<span className="sm:inline">Total Won:</span>
																<span className="font-bold">
																	{day.totalWon}¥
																</span>
															</p>
														) : (
															<p className="text-gray-500 text-base">
																No games yet
															</p>
														)}
													</div>
												</div>
											</div>

											{/* Admin Delete Button */}
											{session?.user?.username === "admin" && (
												<div className="md:col-span-3 flex md:justify-end">
													<button
														onClick={e => handleDeleteClick(day.id, e)}
														className="px-3 py-1 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition-all duration-200 font-medium"
													>
														Delete
													</button>
												</div>
											)}
										</div>
									</div>
								</Link>
							</motion.div>
						))
					)}
				</div>
			</motion.div>

			{/* Enhanced Pagination */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5, delay: 0.8 }}
			>
				{totalPages > 1 && (
					<div className="flex justify-center items-center gap-4 mt-8">
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-gray-800 transition-colors duration-200"
						>
							<FaChevronLeft className="w-5 h-5 text-purple-400" />
						</button>
						<span className="text-purple-400 font-medium">
							Page {currentPage} of {totalPages}
						</span>
						<button
							onClick={() =>
								setCurrentPage(prev => Math.min(prev + 1, totalPages))
							}
							disabled={currentPage === totalPages}
							className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:hover:bg-gray-800 transition-colors duration-200"
						>
							<FaChevronRight className="w-5 h-5 text-purple-400" />
						</button>
					</div>
				)}
			</motion.div>

			<Modal
				isOpen={isDeleteModalOpen}
				onClose={() => {
					setIsDeleteModalOpen(false);
					setDeletePassword("");
					setDeleteError("");
				}}
				title="Delete Game Day"
			>
				<div className="space-y-4 text-white">
					<p>
						Are you sure you want to delete this game day? This action cannot be
						undone.
					</p>
					<div>
						<label className="block text-sm font-medium mb-1">
							Enter password to confirm
						</label>
						<input
							type="password"
							value={deletePassword}
							onChange={e => setDeletePassword(e.target.value)}
							className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							placeholder="Enter password"
						/>
						{deleteError && (
							<p className="text-red-500 text-sm mt-1">{deleteError}</p>
						)}
					</div>
					<div className="flex justify-end gap-3 mt-6">
						<button
							type="button"
							onClick={() => {
								setIsDeleteModalOpen(false);
								setDeletePassword("");
								setDeleteError("");
							}}
							className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleDeleteGameDay}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Delete
						</button>
					</div>
				</div>
			</Modal>
		</main>
	);
}
