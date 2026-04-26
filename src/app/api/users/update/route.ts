import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(request: Request) {
	try {
		const session = await getServerSession(authOptions);

		// Check if the current user is an admin
		if (!session?.user?.username) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const currentUser = await prisma.user.findUnique({
			where: { username: session.user.username },
			select: { role: true },
		});

		if (!currentUser || currentUser.role !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Get the request body
		const body = await request.json();
		const { userId, role } = body;

		if (!userId || !role) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Validate role
		if (!["USER", "MODERATOR", "ADMIN"].includes(role)) {
			return NextResponse.json({ error: "Invalid role" }, { status: 400 });
		}

		// Update the user's role
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { role },
			select: { id: true, username: true, role: true },
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error("Error updating user role:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
