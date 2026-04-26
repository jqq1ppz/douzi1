import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Props = {
	params: Promise<{
		id: string;
	}>;
};

export async function GET(
	request: NextRequest,
	props: Props,
): Promise<NextResponse> {
	try {
		const params = await props.params;

		const gameDay = await prisma.gameDay.findUnique({
			where: {
				id: params.id,
			},
			include: {
				games: {
					orderBy: {
						createdAt: "desc",
					},
				},
				GameSponsorship: {
					where: {
						active: true,
					},
					include: {
						player: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		if (!gameDay) {
			return NextResponse.json(
				{ error: "Game day not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ data: gameDay });
	} catch (error) {
		console.error("Error fetching game day:", error);
		return NextResponse.json(
			{ error: "Error fetching game day" },
			{ status: 500 },
		);
	}
}
