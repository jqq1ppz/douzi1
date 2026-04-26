import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
	try {
		const players = await prisma.player.findMany({
			select: {
				id: true,
				name: true,
				active: true,
				createdAt: true,
			},
		});

		const playersWithStats = await Promise.all(
			players.map(async player => {
				// Get games where player participated
				const games = await prisma.game.findMany({
					where: {
						OR: [
							{ winners: { has: player.name } },
							{ losers: { has: player.name } },
						],
					},
					orderBy: {
						timestamp: "desc",
					},
				});

				const winCount = games.filter(game =>
					game.winners.includes(player.name),
				).length;
				const totalGames = games.length;
				const winRate = totalGames > 0 ? (winCount / totalGames) * 100 : 0;

				// Get last game date
				const lastGame = await prisma.gameDay.findFirst({
					where: {
						games: {
							some: {
								OR: [
									{ winners: { has: player.name } },
									{ losers: { has: player.name } },
								],
							},
						},
					},
					orderBy: {
						date: "desc",
					},
					select: {
						date: true,
					},
				});

				return {
					...player,
					lastGameDate: lastGame?.date || null,
					totalGames,
					winCount,
					loseCount: totalGames - winCount,
					winRate,
				};
			}),
		);

		// Sort by lastGameDate (most recent first)
		playersWithStats.sort((a, b) => {
			// If both have lastGameDate, compare them
			if (a.lastGameDate && b.lastGameDate) {
				return (
					new Date(b.lastGameDate).getTime() -
					new Date(a.lastGameDate).getTime()
				);
			}
			if (a.lastGameDate) return -1;
			if (b.lastGameDate) return 1;
			return a.name.localeCompare(b.name);
		});

		return NextResponse.json(playersWithStats);
	} catch (error) {
		console.error("Error fetching player stats:", error);
		return NextResponse.json(
			{ error: "Failed to fetch player stats" },
			{ status: 500 },
		);
	}
}
