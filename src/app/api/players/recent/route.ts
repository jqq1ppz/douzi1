import { NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";

interface Player {
	id: string;
	name: string;
}

interface Game {
	winners: string[];
	losers: string[];
}

export async function GET() {
	try {
		const twoWeeksAgo = new Date();
		twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 10);

		// First get recent games
		const recentGames = await prisma.game.findMany({
			where: {
				gameDay: {
					date: {
						gte: twoWeeksAgo,
					},
				},
			},
			select: {
				winners: true,
				losers: true,
			},
		});

		// Extract unique player names
		const playerNames = new Set<string>();
		recentGames.forEach((game: Game) => {
			game.winners.forEach((name: string) => playerNames.add(name));
			game.losers.forEach((name: string) => playerNames.add(name));
		});

		// Get player details
		const players = await prisma.player.findMany({
			where: {
				name: {
					in: Array.from(playerNames),
				},
			},
		});

		// Sort players with pinyin for Chinese characters
		players.sort((a: Player, b: Player) => {
			const pinyinA = pinyin(a.name, { toneType: "none", type: "array" }).join(
				"",
			);
			const pinyinB = pinyin(b.name, { toneType: "none", type: "array" }).join(
				"",
			);
			return pinyinA.localeCompare(pinyinB, "en");
		});

		return NextResponse.json(players);
	} catch (error) {
		console.error("Failed to fetch recent players:", error);
		return NextResponse.json(
			{ error: "Failed to fetch recent players" },
			{ status: 500 },
		);
	}
}
