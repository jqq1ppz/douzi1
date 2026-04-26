import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.username) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { username: session.user.username },
			select: { uiPreference: true },
		});

		return NextResponse.json({ uiPreference: user?.uiPreference ?? 1 });
	} catch (error) {
		console.error("Failed to get UI preference:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.username) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { uiPreference } = await request.json();

		const updatedUser = await prisma.user.update({
			where: { username: session.user.username },
			data: { uiPreference },
			select: { uiPreference: true },
		});

		return NextResponse.json(updatedUser);
	} catch (error) {
		console.error("Failed to update UI preference:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
