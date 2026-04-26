import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(request: Request) {
	try {
		const { oldName, newName } = await request.json();

		// Update Player record
		await prisma.player.updateMany({
			where: { name: oldName },
			data: { name: newName },
		});

		// Update GameDay records
		await prisma.gameDay.updateMany({
			where: { biggestWinner: oldName },
			data: { biggestWinner: newName },
		});

		await prisma.gameDay.updateMany({
			where: { biggestLoser: oldName },
			data: { biggestLoser: newName },
		});

		// Update Game records
		const gamesWithOldName = await prisma.game.findMany({
			where: {
				OR: [{ winners: { has: oldName } }, { losers: { has: oldName } }],
			},
		});

		for (const game of gamesWithOldName) {
			await prisma.game.update({
				where: { id: game.id },
				data: {
					winners: game.winners.map(name =>
						name === oldName ? newName : name,
					),
					losers: game.losers.map(name => (name === oldName ? newName : name)),
				},
			});
		}

		// Update Payout records
		await prisma.payout.updateMany({
			where: { fromUser: oldName },
			data: { fromUser: newName },
		});

		await prisma.payout.updateMany({
			where: { toUser: oldName },
			data: { toUser: newName },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error updating player name:", error);
		return NextResponse.json(
			{ error: "Failed to update player name" },
			{ status: 500 },
		);
	}
}
