import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const gameDayId = await context.params;

		if (!gameDayId) {
			return NextResponse.json(
				{ error: "Game day ID is required" },
				{ status: 400 },
			);
		}

		const games = await prisma.game.findMany({
			where: { gameDayId: gameDayId.id },
			orderBy: { timestamp: "desc" },
		});

		// Calculate net balances for each player
		const netBalances = new Map<
			string,
			{
				name: string;
				balance: number;
				gamesWon: number;
				gamesLost: number;
				totalWinAmount: number;
				totalLoseAmount: number;
			}
		>();

		games.forEach(game => {
			const gameAmount = game.amount || 50;
			const actualAmount =
				game.gameType === "surrendered" ? gameAmount / 2 : gameAmount;

			game.winners.forEach(winner => {
				const current = netBalances.get(winner) || {
					name: winner,
					balance: 0,
					gamesWon: 0,
					gamesLost: 0,
					totalWinAmount: 0,
					totalLoseAmount: 0,
				};
				netBalances.set(winner, {
					...current,
					balance: current.balance + actualAmount,
					gamesWon: current.gamesWon + 1,
					totalWinAmount: current.totalWinAmount + actualAmount,
				});
			});

			game.losers.forEach(loser => {
				const current = netBalances.get(loser) || {
					name: loser,
					balance: 0,
					gamesWon: 0,
					gamesLost: 0,
					totalWinAmount: 0,
					totalLoseAmount: 0,
				};
				netBalances.set(loser, {
					...current,
					balance: current.balance - actualAmount,
					gamesLost: current.gamesLost + 1,
					totalLoseAmount: current.totalLoseAmount + actualAmount,
				});
			});
		});

		const playerBalances = Array.from(netBalances.values()).sort(
			(a, b) => b.balance - a.balance,
		);

		return NextResponse.json(playerBalances);
	} catch (error) {
		console.error("Error calculating player balances:", error);
		return NextResponse.json(
			{ error: "Failed to calculate player balances" },
			{ status: 500 },
		);
	}
}
