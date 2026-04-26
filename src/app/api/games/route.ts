import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Game } from "../../types/index";

interface SponsorshipInput {
	playerName: string;
	sponsorName: string;
	percentage: number;
}

interface SponsorshipData {
	playerId: string;
	sponsorName: string;
	percentage: number;
	gameId: string | null;
	gameDayId: string;
	active: boolean;
}

export async function POST(request: Request) {
	try {
		if (!request.body) {
			return NextResponse.json(
				{ error: "Empty request body" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		console.log("Received game creation data:", {
			winners: body.winners,
			losers: body.losers,
			gameType: body.gameType,
			gameDayId: body.gameDayId,
			amount: body.amount,
			sponsorships: body.sponsorships,
			map: body.map,
		});

		const { winners, losers, gameType, gameDayId, amount } = body;

		// Validate required fields
		if (!winners || !losers || !gameType || !gameDayId) {
			console.error("Missing required fields:", {
				winners,
				losers,
				gameType,
				gameDayId,
			});
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Validate amount is one of the allowed values
		const allowedAmounts = [50, 75, 100, 150, 200];
		const gameAmount = amount || 50; // Default to 50 if not specified
		if (!allowedAmounts.includes(gameAmount)) {
			return NextResponse.json(
				{ error: "Invalid game amount. Must be one of: 50, 75, 100, 150, 200" },
				{ status: 400 },
			);
		}

		const createdBy = body.createdBy || "Anonymous";
		const createdById = body.createdById || null;

		console.log("Creating game with data:", {
			winners,
			losers,
			gameType,
			gameDayId,
			createdBy,
			createdById,
			map: body.map || null,
			amount: gameAmount,
		});

		// Update game day status to IN_PROGRESS if it's NOT_STARTED
		await prisma.gameDay.update({
			where: { id: gameDayId },
			data: {
				status: "IN_PROGRESS",
			},
		});

		const game = await prisma.$transaction(async tx => {
			// First get all players for sponsorships
			const players = await tx.player.findMany({
				where: {
					name: { in: [...winners, ...losers] },
				},
			});

			// Create the game
			const createdGame = await tx.game.create({
				data: {
					winners,
					losers,
					gameType,
					gameDayId,
					createdBy,
					createdById,
					map: body.map || null,
					amount: gameAmount,
				},
				include: {
					sponsorships: {
						include: {
							player: true,
						},
					},
				},
			});

			// Handle sponsorships if present
			if (body.sponsorships?.length > 0) {
				const sponsorshipData = body.sponsorships
					.map((s: SponsorshipInput) => {
						const player = players.find(p => p.name === s.playerName);
						return player
							? {
									playerId: player.id,
									sponsorName: s.sponsorName,
									percentage: s.percentage,
									gameId: createdGame.id,
									gameDayId,
									active: true,
							  }
							: null;
					})
					.filter((s: SponsorshipData): s is SponsorshipData => s !== null);

				if (sponsorshipData.length > 0) {
					await tx.gameSponsorship.createMany({
						data: sponsorshipData,
					});
				}
			}

			// Return game with sponsorships
			return tx.game.findUnique({
				where: { id: createdGame.id },
				include: {
					sponsorships: {
						include: {
							player: true,
						},
					},
				},
			});
		});

		console.log("Successfully created game:", game);

		// Get all games for this game day
		const allGames = await prisma.game.findMany({
			where: { gameDayId },
		});

		// Calculate balances
		const balances = new Map<string, number>();

		allGames.forEach(game => {
			const baseAmount = game.amount || 50;
			const points = game.gameType === "full" ? baseAmount : baseAmount / 2;

			game.winners.forEach((winner: string) => {
				balances.set(winner, (balances.get(winner) || 0) + points);
			});

			game.losers.forEach((loser: string) => {
				balances.set(loser, (balances.get(loser) || 0) - points);
			});
		});

		// Find biggest winner and loser
		let maxBalance = -Infinity;
		let minBalance = Infinity;
		let biggestWinner = "";
		let biggestLoser = "";

		balances.forEach((balance, player) => {
			if (balance > maxBalance) {
				maxBalance = balance;
				biggestWinner = player;
			}
			if (balance < minBalance) {
				minBalance = balance;
				biggestLoser = player;
			}
		});

		// Update game day with winner/loser info
		await prisma.gameDay.update({
			where: { id: gameDayId },
			data: {
				biggestWinner,
				biggestLoser,
				biggestWinnerAmount: maxBalance,
				biggestLoserAmount: minBalance,
			},
		});

		if (!game) throw new Error("Failed to create game");
		return NextResponse.json({
			success: true,
			data: {
				...game,
				sponsorships: await prisma.gameSponsorship.findMany({
					where: {
						gameId: game.id,
						active: true,
					},
					include: {
						player: true,
					},
				}),
			},
			message: "Game created successfully",
		});
	} catch (error) {
		// Detailed error logging
		console.error("Full error object:", {
			name: (error as Error)?.name,
			message: (error as Error)?.message,
			stack: (error as Error)?.stack,
			body: request?.body,
		});

		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 },
		);
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const gameDayId = searchParams.get("gameDayId");

		const games = await prisma.game.findMany({
			where: {
				gameDayId: gameDayId || undefined,
			},
			include: {
				sponsorships: {
					where: { active: true },
					include: {
						player: true,
					},
				},
			},
			orderBy: {
				timestamp: "desc",
			},
		});

		return NextResponse.json(games);
	} catch (error) {
		console.error("Error fetching games:", error);
		return NextResponse.json(
			{ error: "Failed to fetch games" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const gameId = searchParams.get("id");
		const gameDayId = searchParams.get("gameDayId");

		if (!gameId || !gameDayId) {
			return NextResponse.json(
				{ error: "Game ID and Game Day ID are required" },
				{ status: 400 },
			);
		}

		// Delete the game
		await prisma.game.delete({
			where: { id: gameId },
		});

		// Get remaining games to recalculate stats
		const remainingGames = await prisma.game.findMany({
			where: { gameDayId },
		});

		// Recalculate balances
		const balances = new Map<string, number>();

		remainingGames.forEach(game => {
			const points = game.gameType === "full" ? game.amount : game.amount / 2;

			game.winners.forEach((winner: string) => {
				balances.set(winner, (balances.get(winner) || 0) + points);
			});

			game.losers.forEach((loser: string) => {
				balances.set(loser, (balances.get(loser) || 0) - points);
			});
		});

		// Find new biggest winner and loser
		let maxBalance = -Infinity;
		let minBalance = Infinity;
		let biggestWinner = "";
		let biggestLoser = "";

		balances.forEach((balance, player) => {
			if (balance > maxBalance) {
				maxBalance = balance;
				biggestWinner = player;
			}
			if (balance < minBalance) {
				minBalance = balance;
				biggestLoser = player;
			}
		});

		// Update game day
		await prisma.gameDay.update({
			where: { id: gameDayId },
			data: {
				biggestWinner: balances.size > 0 ? biggestWinner : null,
				biggestLoser: balances.size > 0 ? biggestLoser : null,
				biggestWinnerAmount: balances.size > 0 ? maxBalance : null,
				biggestLoserAmount: balances.size > 0 ? minBalance : null,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Game deleted successfully",
			},
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	} catch (error) {
		console.error("DELETE Error:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Error deleting game",
			},
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
}

export async function PUT(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const gameId = searchParams.get("id");
		const body = await request.json();
		console.log("PUT request body:", body); // Keep this for debugging

		const { winners, losers, gameDayId, gameType, amount, sponsorships, map } =
			body;

		// Log the map value specifically
		console.log("Updating map to:", map);

		const updatedGame = await prisma.$transaction(async tx => {
			// First update the game
			const game = await tx.game.update({
				where: {
					id: gameId as string,
				},
				data: {
					winners,
					losers,
					gameDayId,
					gameType,
					amount,
					map: map || null, // Ensure map is explicitly handled
					updatedAt: new Date(), // Force update timestamp
				},
			});

			// Handle sponsorships
			await tx.gameSponsorship.deleteMany({
				where: { gameId },
			});

			// Get players for sponsorships
			const players = await tx.player.findMany({
				where: {
					name: {
						in: Object.keys(sponsorships || {}),
					},
				},
			});

			// Create new sponsorships if any
			if (sponsorships && Object.keys(sponsorships).length > 0) {
				const sponsorshipData = Object.entries(sponsorships)
					.map(([playerName, sponsorName]) => {
						const player = players.find(p => p.name === playerName);
						return player
							? {
									playerId: player.id,
									sponsorName: sponsorName as string,
									percentage: 100,
									gameId,
									gameDayId,
									active: true,
							  }
							: null;
					})
					.filter((s): s is SponsorshipData => s !== null);

				if (sponsorshipData.length > 0) {
					await tx.gameSponsorship.createMany({
						data: sponsorshipData,
					});
				}
			}

			// Return the final game state with all relations
			return tx.game.findUnique({
				where: { id: gameId as string },
				include: {
					sponsorships: {
						where: { active: true },
						include: {
							player: true,
						},
					},
				},
			});
		});

		if (!updatedGame) {
			throw new Error("Failed to update game");
		}

		console.log("Updated game:", updatedGame); // Log the final state
		return NextResponse.json(updatedGame);
	} catch (error) {
		console.error("Detailed error in PUT /api/games:", error);
		return NextResponse.json(
			{ error: "Failed to update game" },
			{ status: 500 },
		);
	}
}
