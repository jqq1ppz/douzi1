import prisma from "../../lib/prisma";

async function updatePlayerName(oldName: string, newName: string) {
	try {
		// Update Player record
		await prisma.player.updateMany({
			where: {
				name: oldName,
			},
			data: {
				name: newName,
			},
		});

		// Update GameDay records - biggestWinner and biggestLoser
		await prisma.gameDay.updateMany({
			where: {
				biggestWinner: oldName,
			},
			data: {
				biggestWinner: newName,
			},
		});

		await prisma.gameDay.updateMany({
			where: {
				biggestLoser: oldName,
			},
			data: {
				biggestLoser: newName,
			},
		});

		// Update Game records - winners and losers arrays
		const gamesWithOldName = await prisma.game.findMany({
			where: {
				OR: [
					{
						winners: {
							has: oldName,
						},
					},
					{
						losers: {
							has: oldName,
						},
					},
				],
			},
		});

		for (const game of gamesWithOldName) {
			await prisma.game.update({
				where: {
					id: game.id,
				},
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
			where: {
				fromUser: oldName,
			},
			data: {
				fromUser: newName,
			},
		});

		await prisma.payout.updateMany({
			where: {
				toUser: oldName,
			},
			data: {
				toUser: newName,
			},
		});

		console.log(
			`Successfully updated player name from "${oldName}" to "${newName}" in all tables`,
		);
	} catch (error) {
		console.error("Error updating player name:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Get command line arguments
const oldName = process.argv[2];
const newName = process.argv[3];

if (!oldName || !newName) {
	console.error("Please provide both old and new names as arguments");
	process.exit(1);
}

updatePlayerName(oldName, newName);
