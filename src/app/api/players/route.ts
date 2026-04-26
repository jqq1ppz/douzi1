import { NextResponse } from "next/server";
import { pinyin } from "pinyin-pro";
import prisma from "@/lib/prisma";
import { PlayerWithBalance } from "@/app/types";

// Add error handling for Prisma initialization
// let prisma: PrismaClient;

// try {
// 	prisma = new PrismaClient();
// } catch (error) {
// 	console.error("Failed to initialize Prisma:", error);
// 	throw error;
// }

export async function GET() {
	try {
		console.log(
			"Database URL:",
			process.env.DATABASE_URL?.slice(0, 20) + "...",
		); // Log partial DB URL for debugging

		const players = await prisma.player.findMany({
			select: {
				id: true,
				name: true,
				active: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		// Get last played dates
		const playersWithLastGame = await Promise.all(
			players.map(async player => {
				const lastGame = await prisma.gameDay.findFirst({
					where: {
						OR: [
							{ games: { some: { winners: { has: player.name } } } },
							{ games: { some: { losers: { has: player.name } } } },
						],
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
				};
			}),
		);

		// Sort players with pinyin
		playersWithLastGame.sort((a, b) => {
			const pinyinA = pinyin(a.name, { toneType: "none", type: "array" }).join(
				"",
			);
			const pinyinB = pinyin(b.name, { toneType: "none", type: "array" }).join(
				"",
			);
			return pinyinA.localeCompare(pinyinB);
		});

		return NextResponse.json(playersWithLastGame);
	} catch (error: Error | unknown) {
		const err = error as Error;
		console.error("Detailed error fetching players:", {
			name: err?.name,
			message: err?.message,
			stack: err?.stack,
			connectionUrl: process.env.DATABASE_URL ? "Set" : "Not set",
		});
		return NextResponse.json(
			{
				error: "Failed to fetch players",
				details: err?.message,
				connectionStatus: process.env.DATABASE_URL
					? "Database URL is set"
					: "Database URL is missing",
			},
			{ status: 500 },
		);
	} finally {
		await prisma.$disconnect();
	}
}

export async function POST(request: Request) {
	try {
		const { name } = await request.json();

		// Check if player already exists (case-insensitive)
		const existingPlayer = await prisma.player.findFirst({
			where: {
				name: {
					equals: name,
					mode: "insensitive", // This makes the comparison case-insensitive
				},
			},
		});

		if (existingPlayer) {
			return NextResponse.json(
				{ error: "Player already exists" },
				{ status: 400 },
			);
		}

		// Create new player
		const player = await prisma.player.create({
			data: { name },
		});

		return NextResponse.json(player);
	} catch (error) {
		console.error("Error creating player:", error);
		return NextResponse.json(
			{ error: "Failed to create player" },
			{ status: 500 },
		);
	}
}
