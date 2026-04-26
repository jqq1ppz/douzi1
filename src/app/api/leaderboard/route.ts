import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Season } from "@/app/types";
import { HIDE_PLAYERS_BEFORE } from "@/app/constants/hideDate";
import { playersToHideLeaderboard } from "@/app/constants/playersToHide";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const seasonId = searchParams.get("seasonId");
		const excludeSurrendered =
			searchParams.get("excludeSurrendered") === "true";

		if (!seasonId) {
			return NextResponse.json(
				{ error: "Season ID is required" },
				{ status: 400 },
			);
		}

		const season = JSON.parse(seasonId) as Season;

		// Get all game days within the season
		const gameDays = await prisma.gameDay.findMany({
			where: {
				date: {
					gte: season.startDate,
					lte: season.endDate || new Date(),
				},
			},
			include: {
				games: true,
			},
		});

		// Get all players
		const players = await prisma.player.findMany();

		// Calculate stats for each player
		const playerStats = players.map(player => {
			let balance = 0;
			let rounds = 0;
			let totalPossibleWinnings = 0;

			gameDays.forEach(day => {
				day.games?.forEach(game => {
					if (
						game.winners.includes(player.name) ||
						game.losers.includes(player.name)
					) {
						if (excludeSurrendered && game.gameType === "surrendered") {
							return;
						}
						rounds++;
						const amount =
							game.gameType === "surrendered" ? game.amount / 2 : game.amount;
						totalPossibleWinnings += amount;

						if (game.winners.includes(player.name)) {
							balance += amount;
						}
						if (game.losers.includes(player.name)) {
							balance -= amount;
						}
					}
				});
			});

			// Calculate win ratio based on actual amounts
			const winRatio =
				rounds > 0
					? Math.min(
							((balance + totalPossibleWinnings) /
								(totalPossibleWinnings * 2)) *
								100,
							100,
					  )
					: 0;

			return {
				name: player.name,
				balance,
				rounds,
				winRatio: parseFloat(winRatio.toFixed(1)),
			};
		});

		// Sort by balance by default
		const sortedStats = playerStats.sort((a, b) => b.balance - a.balance);

		// Filter and process players
		const filteredStats = sortedStats
			.filter(player => {
				const hasPlayedAfterCutoff = gameDays.some(day => {
					const gameDate = new Date(day.date);
					return (
						gameDate > HIDE_PLAYERS_BEFORE &&
						day.games?.some(
							game =>
								game.winners.includes(player.name) ||
								game.losers.includes(player.name),
						)
					);
				});

				return (
					!playersToHideLeaderboard.includes(player.name) ||
					hasPlayedAfterCutoff
				);
			})
			.map(player => ({
				name: player.name,
				balance: player.balance,
				rounds: player.rounds,
				winRatio: player.winRatio,
				hasPlayedAfterCutoff: gameDays.some(day => {
					const gameDate = new Date(day.date);
					return (
						gameDate > HIDE_PLAYERS_BEFORE &&
						day.games?.some(
							game =>
								game.winners.includes(player.name) ||
								game.losers.includes(player.name),
						)
					);
				}),
			}));

		return NextResponse.json({ stats: filteredStats });
	} catch (error) {
		console.error("Error calculating leaderboard:", error);
		return NextResponse.json(
			{ error: "Failed to calculate leaderboard" },
			{ status: 500 },
		);
	}
}
