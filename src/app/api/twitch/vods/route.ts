import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { channel } = await request.json();

		// First get the access token
		const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: process.env.TWITCH_CLIENT_ID!,
				client_secret: process.env.TWITCH_CLIENT_SECRET!,
				grant_type: "client_credentials",
			}),
		});

		const { access_token } = await tokenResponse.json();

		// Get user ID first
		const userResponse = await fetch(
			`https://api.twitch.tv/helix/users?login=${channel}`,
			{
				headers: {
					"Client-ID": process.env.TWITCH_CLIENT_ID!,
					Authorization: `Bearer ${access_token}`,
				},
			},
		);

		const userData = await userResponse.json();
		const userId = userData.data[0]?.id;

		if (!userId) {
			return NextResponse.json([]);
		}

		// Then get VODs
		const vodsResponse = await fetch(
			`https://api.twitch.tv/helix/videos?user_id=${userId}&first=10&type=archive`,
			{
				headers: {
					"Client-ID": process.env.TWITCH_CLIENT_ID!,
					Authorization: `Bearer ${access_token}`,
				},
			},
		);

		const vodsData = await vodsResponse.json();
		return NextResponse.json(vodsData.data || []);
	} catch (error) {
		console.error("Error fetching VODs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch VODs" },
			{ status: 500 },
		);
	}
}
