import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		// Delete in correct order due to foreign key constraints
		await prisma.game.deleteMany({});
		await prisma.gameDay.deleteMany({});
		await prisma.player.deleteMany({});

		return NextResponse.json({ message: "Database reset successful" });
	} catch (error) {
		console.error("Reset Error:", error);
		return NextResponse.json(
			{ error: "Error resetting database" },
			{ status: 500 },
		);
	}
}
