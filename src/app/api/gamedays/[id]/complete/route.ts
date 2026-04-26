import prisma from "@/lib/prisma";

// Define the enum values
const GameDayStatus = {
	NOT_STARTED: "NOT_STARTED",
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
} as const;

export async function POST(request: Request) {
	const url = new URL(request.url);
	const pathParts = url.pathname.split("/");
	const id = pathParts[pathParts.length - 2];

	console.log("URL:", url.toString());
	console.log("Path parts:", pathParts);
	console.log("Attempting to complete game day with ID:", id);

	if (!id) {
		return Response.json(
			{
				success: false,
				error: "Game day ID is required",
			},
			{
				status: 400,
				headers: { "Content-Type": "application/json" },
			},
		);
	}

	try {
		const gameDay = await prisma.gameDay.update({
			where: { id },
			data: {
				status: GameDayStatus.COMPLETED,
			},
		});

		return Response.json(
			{
				success: true,
				data: gameDay,
			},
			{ status: 200 },
		);
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Failed to complete game day";
		console.error("Error in complete route:", errorMessage);

		return Response.json(
			{
				success: false,
				error: errorMessage,
			},
			{ status: 500 },
		);
	}
}
