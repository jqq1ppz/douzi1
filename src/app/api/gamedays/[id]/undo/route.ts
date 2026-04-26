import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../../../lib/auth";

type Props = {
	params: Promise<{
		id: string;
	}>;
};

export async function PUT(request: Request, props: Props) {
	const params = await props.params;
	const session = await getServerSession(authOptions);

	if (!session?.user?.username) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// Get the current user's role
	const currentUser = await prisma.user.findUnique({
		where: { username: session.user.username },
		select: { role: true },
	});

	if (!currentUser) {
		return NextResponse.json({ error: "User not found" }, { status: 404 });
	}

	// Check if user is admin or moderator
	if (!["ADMIN", "MODERATOR"].includes(currentUser.role)) {
		return NextResponse.json(
			{ error: "Only admins and moderators can undo game days" },
			{ status: 403 },
		);
	}

	try {
		// Get the most recently completed game day
		const latestCompletedGame = await prisma.gameDay.findFirst({
			where: { status: "COMPLETED" },
			orderBy: { date: "desc" },
		});

		// Check if this is the latest completed game
		if (latestCompletedGame?.id !== params.id) {
			return NextResponse.json(
				{ error: "Only the most recent completed game can be undone" },
				{ status: 403 },
			);
		}

		const gameDay = await prisma.gameDay.update({
			where: { id: params.id },
			data: { status: "IN_PROGRESS" },
		});

		return NextResponse.json(gameDay);
	} catch (error) {
		console.error("Failed to undo game day:", error);
		return NextResponse.json(
			{ error: "Failed to undo game day" },
			{ status: 500 },
		);
	}
}
