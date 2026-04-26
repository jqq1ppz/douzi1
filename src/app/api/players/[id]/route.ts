import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params;
		const { name } = await request.json();

		// Check if player already exists with this name
		const existingPlayer = await prisma.player.findUnique({
			where: { name },
		});

		if (existingPlayer && existingPlayer.id !== id) {
			return NextResponse.json(
				{ error: "A player with this name already exists" },
				{ status: 400 },
			);
		}

		const updatedPlayer = await prisma.player.update({
			where: { id },
			data: { name },
		});

		return NextResponse.json(updatedPlayer);
	} catch (error) {
		console.error("Error updating player:", error);
		return NextResponse.json(
			{ error: "Failed to update player" },
			{ status: 500 },
		);
	} finally {
		await prisma.$disconnect();
	}
}

export async function DELETE(
	request: Request,
	context: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await context.params;
		await prisma.player.delete({
			where: { id },
		});

		return NextResponse.json({ message: "Player deleted successfully" });
	} catch (error) {
		console.error("Error deleting player:", error);
		return NextResponse.json(
			{ error: "Failed to delete player" },
			{ status: 500 },
		);
	} finally {
		await prisma.$disconnect();
	}
}
