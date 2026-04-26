import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function GET() {
	try {
		const gameDays = await prisma.gameDay.findMany({
			include: {
				games: true,
			},
			orderBy: {
				date: "desc",
			},
		});
		return Response.json(gameDays);
	} catch (error) {
		console.error("GET gamedays Error:", error);
		return Response.json(
			{ error: "Failed to fetch game days" },
			{ status: 500 },
		);
	}
}

export async function POST(): Promise<NextResponse> {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user?.id) {
			console.log("No valid user ID in session"); // Debug log
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verify user exists in database
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const gameDay = await prisma.gameDay.create({
			data: {
				date: new Date(),
				creatorId: user.id,
				creatorName: user.name || "Anonymous",
				status: "NOT_STARTED",
			},
		});

		return NextResponse.json({ data: gameDay });
	} catch (error) {
		console.error("Detailed error:", error);
		return NextResponse.json(
			{
				error: "Error creating game day",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ error: "Game day ID is required" },
				{ status: 400 },
			);
		}

		// First check if the game day exists
		const gameDay = await prisma.gameDay.findUnique({
			where: { id },
		});

		if (!gameDay) {
			return NextResponse.json(
				{ error: "Game day not found" },
				{ status: 404 },
			);
		}

		// Delete all related games first
		await prisma.game.deleteMany({
			where: { gameDayId: id },
		});

		// Then delete the game day
		await prisma.gameDay.delete({
			where: { id },
		});

		return NextResponse.json({ message: "Game day deleted successfully" });
	} catch (error) {
		console.error("DELETE Error details:", error);
		return NextResponse.json(
			{
				error: "Error deleting game day",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
