import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export async function GET() {
	try {
		const sponsorships = await prisma.gameSponsorship.findMany({
			where: {
				active: true,
				OR: [{ gameDayId: { not: null } }, { gameDayId: null }],
			},
			include: {
				player: {
					select: {
						name: true,
					},
				},
			},
		});
		return NextResponse.json(sponsorships);
	} catch (error) {
		console.error("GET Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch sponsorships" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		console.log("Received POST body:", body);

		if (!body.playerId || !body.sponsorName || !body.gameDayId) {
			return NextResponse.json({
				success: false,
				error: "playerId, sponsorName, and gameDayId are required",
			});
		}

		const { playerId, sponsorName, gameDayId } = body;

		const existingSponsorship = await prisma.gameSponsorship.findFirst({
			where: {
				playerId,
				gameDayId,
				active: true,
			},
		});

		if (existingSponsorship) {
			return NextResponse.json({
				success: false,
				error: "A sponsorship already exists for this player on this game day",
			});
		}

		const sponsorship = await prisma.gameSponsorship.create({
			data: {
				playerId,
				sponsorName,
				percentage: 100,
				active: true,
				gameDayId,
			},
		});

		return NextResponse.json({
			success: true,
			data: sponsorship,
		});
	} catch (error: any) {
		console.error("POST Error:", error);
		return NextResponse.json({
			success: false,
			error: error.message || "Failed to save sponsorship",
		});
	}
}

export async function PATCH(request: Request) {
	try {
		const body = await request.json();
		console.log("Updating sponsorship:", body);

		if (!body.playerId || !body.sponsorName) {
			return NextResponse.json(
				{
					error: "playerId and sponsorName are required",
				},
				{ status: 400 },
			);
		}

		const existingSponsorship = await prisma.gameSponsorship.findFirst({
			where: {
				playerId: body.playerId,
				sponsorName: body.sponsorName,
			},
		});

		if (!existingSponsorship) {
			return NextResponse.json(
				{
					error: "Sponsorship not found",
				},
				{ status: 404 },
			);
		}

		const sponsorship = await prisma.gameSponsorship.update({
			where: {
				id: existingSponsorship.id,
			},
			data: {
				sponsorName: body.newSponsorName || body.sponsorName,
				active: body.active,

				gameDayId: body.duration === "TODAY_ONLY" ? body.gameDayId : null,
			},
		});

		return NextResponse.json(sponsorship);
	} catch (error: any) {
		console.error("PATCH Error:", error);
		return NextResponse.json(
			{
				error: error.message || "Failed to update sponsorship",
			},
			{ status: 500 },
		);
	}
}
