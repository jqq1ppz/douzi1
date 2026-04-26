import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		const { searchParams } = new URL(request.url);
		const username = searchParams.get("username");
		const id = searchParams.get("id");

		// If id is provided, fetch that user's role
		if (id) {
			const user = await prisma.user.findUnique({
				where: { id },
				select: { role: true },
			});

			if (!user) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			return NextResponse.json({ role: user.role });
		}

		// If username is provided, fetch that user's role
		if (username) {
			const user = await prisma.user.findUnique({
				where: { username },
				select: { role: true },
			});

			if (!user) {
				return NextResponse.json({ error: "User not found" }, { status: 404 });
			}

			return NextResponse.json({ role: user.role });
		}

		// Otherwise, fetch the current user's role
		if (!session?.user?.username) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { username: session.user.username },
			select: { role: true },
		});

		if (!user) {
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		return NextResponse.json({ role: user.role });
	} catch (error) {
		console.error("Error fetching user role:", error);
		return NextResponse.json(
			{ error: "Error fetching user role" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		console.log("Session:", session);

		if (!session?.user?.username) {
			console.log("No session or username found");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get the current user's role
		const currentUser = await prisma.user.findUnique({
			where: { username: session.user.username },
			select: { role: true },
		});
		console.log("Current user:", currentUser);

		if (!currentUser) {
			console.log("User not found in database");
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		// Only allow admins to update roles
		if (currentUser.role !== "ADMIN") {
			console.log("User is not an admin. Current role:", currentUser.role);
			return NextResponse.json(
				{ error: "Only admins can update roles" },
				{ status: 403 },
			);
		}

		const { userId, role } = await request.json();
		console.log("Request body:", { userId, role });

		if (!userId || !role) {
			console.log("Missing required fields");
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Validate role value
		if (!["USER", "MODERATOR", "ADMIN"].includes(role)) {
			console.log("Invalid role value:", role);
			return NextResponse.json(
				{ error: "Invalid role value" },
				{ status: 400 },
			);
		}

		// Update the user's role
		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: { role },
			select: {
				id: true,
				username: true,
				role: true,
			},
		});
		console.log("Updated user:", updatedUser);

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error("Error updating user role:", error);
		return NextResponse.json(
			{ error: "Error updating user role" },
			{ status: 500 },
		);
	}
}
