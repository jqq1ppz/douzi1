"use client";

import React, { useState, useEffect } from "react";
import { Game, GameSponsorship, GameDay } from "../types";

interface SponsorGameDetail {
	gameId: string;
	playerNames: string[];
	amount: number;
	timestamp: Date;
	gameNumber: number;
}

interface SponsorStats {
	sponsorName: string;
	totalGames: number;
	gamesWon: number;
	gamesLost: number;
	balance: number;
	gameDetails: SponsorGameDetail[];
}

interface Props {
	games: Game[];
}

export function SponsorsSection({ games }: Props) {
	const [sponsorStats, setSponsorStats] = useState<Map<string, SponsorStats>>(
		new Map(),
	);
	const [expandedSponsors, setExpandedSponsors] = useState<Set<string>>(
		new Set(),
	);

	useEffect(() => {
		const stats = new Map<string, SponsorStats>();

		games.forEach((game, index) => {
			const gameSponsors = new Map<
				string,
				{ players: string[]; amount: number }
			>();

			game.sponsorships?.forEach(sponsorship => {
				if (!sponsorship.active) return;

				const { sponsorName, player } = sponsorship;
				if (!player) return;

				const isWinner = game.winners.includes(player.name);
				const isLoser = game.losers.includes(player.name);
				if (!isWinner && !isLoser) return;

				// Calculate base amount considering game type
				const baseAmount =
					game.gameType === "surrendered" ? game.amount / 2 : game.amount;
				const sponsorAmount = (baseAmount * sponsorship.percentage) / 100;
				const finalAmount = isWinner ? sponsorAmount : -sponsorAmount;

				if (!gameSponsors.has(sponsorName)) {
					gameSponsors.set(sponsorName, { players: [], amount: 0 });
				}
				const sponsorGameData = gameSponsors.get(sponsorName)!;
				sponsorGameData.players.push(player.name);
				sponsorGameData.amount += finalAmount;
			});

			// Add game details for each sponsor
			gameSponsors.forEach((gameData, sponsorName) => {
				const currentStats = stats.get(sponsorName) || {
					sponsorName,
					totalGames: 0,
					gamesWon: 0,
					gamesLost: 0,
					balance: 0,
					gameDetails: [],
				};

				currentStats.totalGames++;
				currentStats.balance += gameData.amount;
				if (gameData.amount > 0) currentStats.gamesWon++;
				if (gameData.amount < 0) currentStats.gamesLost++;

				currentStats.gameDetails.push({
					gameId: game.id,
					playerNames: gameData.players,
					amount: gameData.amount,
					timestamp: new Date(game.timestamp),
					gameNumber: games.length - index,
				});

				stats.set(sponsorName, currentStats);
			});
		});

		setSponsorStats(stats);
	}, [games]);

	const toggleSponsor = (sponsorName: string) => {
		const newExpanded = new Set(expandedSponsors);
		if (newExpanded.has(sponsorName)) {
			newExpanded.delete(sponsorName);
		} else {
			newExpanded.add(sponsorName);
		}
		setExpandedSponsors(newExpanded);
	};

	if (sponsorStats.size === 0) {
		return null;
	}

	return (
		<div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-yellow-500/20 shadow-lg">
			<h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
				Sponsor Balances
			</h2>

			<div className="mt-6 space-y-4">
				{Array.from(sponsorStats.values()).map(stats => (
					<div key={stats.sponsorName} className="relative overflow-hidden">
						<div
							onClick={() => toggleSponsor(stats.sponsorName)}
							className="p-4 rounded-lg bg-gray-800/30 border border-yellow-500/10 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer"
						>
							{/* Header Section */}
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-4">
									<h3 className="text-yellow-500 font-bold text-lg">
										{stats.sponsorName}
									</h3>
									{!expandedSponsors.has(stats.sponsorName) && (
										<div className="text-sm">
											<span className="text-green-400 font-medium">
												{stats.gamesWon}W
											</span>
											<span className="text-gray-500 mx-1">/</span>
											<span className="text-red-400 font-medium">
												{stats.gamesLost}L
											</span>
										</div>
									)}
								</div>
								<div
									className={`font-bold text-xl ${
										stats.balance > 0
											? "text-green-400"
											: stats.balance < 0
											? "text-red-400"
											: "text-gray-400"
									}`}
								>
									{stats.balance > 0 && "+"}¥{stats.balance}
								</div>
							</div>

							{/* Expanded Details */}
							{expandedSponsors.has(stats.sponsorName) && (
								<div className="mt-4 space-y-4">
									{/* Game Details */}
									<div className="space-y-2">
										{stats.gameDetails
											.sort(
												(a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
											)
											.map(detail => (
												<div
													key={`${detail.gameId}`}
													className="flex items-center justify-between p-2 rounded-lg bg-gray-800/20 border border-yellow-500/5"
												>
													<div className="flex items-center gap-3">
														<span className="text-gray-400">
															Game {detail.gameNumber}
														</span>
														<span className="text-gray-300">
															{detail.playerNames.join("，")}
														</span>
													</div>
													<span
														className={`font-medium ${
															detail.amount > 0
																? "text-green-400"
																: "text-red-400"
														}`}
													>
														{detail.amount > 0 ? "+" : ""}¥{detail.amount}
													</span>
												</div>
											))}
									</div>

									{/* Summary Stats */}
									<div className="flex gap-6 text-sm p-2 rounded-lg bg-gray-800/20 border border-yellow-500/5">
										<div>
											<span className="text-green-400 font-medium">
												{stats.gamesWon}
											</span>
											<span className="text-gray-500"> Wins</span>
										</div>
										<div>
											<span className="text-red-400 font-medium">
												{stats.gamesLost}
											</span>
											<span className="text-gray-500"> Losses</span>
										</div>
										<div>
											<span className="text-gray-300 font-medium">
												{stats.totalGames}
											</span>
											<span className="text-gray-500"> Total</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
