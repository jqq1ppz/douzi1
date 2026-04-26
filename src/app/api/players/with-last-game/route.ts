import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
	try {
		const players = await prisma.player.findMany({
			select: {
				id: true,
				name: true,
				active: true,
			},
		});

		const playersWithLastGame = await Promise.all(
			players.map(async player => {
				const lastGame = await prisma.game.findFirst({
					where: {
						OR: [
							{ winners: { has: player.name } },
							{ losers: { has: player.name } },
						],
					},
					orderBy: {
						timestamp: "desc",
					},
					select: {
						timestamp: true,
						gameDay: {
							select: {
								date: true,
							},
						},
					},
				});

				return {
					...player,
					lastGameDate: lastGame?.gameDay.date || null,
				};
			}),
		);

		// Sort players by lastGameDate (most recent first)
		const sortedPlayers = playersWithLastGame.sort((a, b) => {
			if (!a.lastGameDate) return 1; // null dates go to the end
			if (!b.lastGameDate) return -1;
			return (
				new Date(b.lastGameDate).getTime() - new Date(a.lastGameDate).getTime()
			);
		});

		return NextResponse.json(sortedPlayers);
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Failed to fetch players" },
			{ status: 500 },
		);
	}
}
