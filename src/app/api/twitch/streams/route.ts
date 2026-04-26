import { NextResponse } from "next/server";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

interface TwitchUser {
	id: string;
	login: string;
	profile_image_url: string;
}

export async function POST(request: Request) {
	try {
		const { channels } = await request.json();

		// Get OAuth token
		const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
		});
		const { access_token } = await tokenResponse.json();

		// Get user IDs
		const usersResponse = await fetch(
			`https://api.twitch.tv/helix/users?${channels
				.map((login: string) => `login=${login}`)
				.join("&")}`,
			{
				headers: {
					"Client-ID": TWITCH_CLIENT_ID!,
					Authorization: `Bearer ${access_token}`,
				},
			},
		);
		const usersData = await usersResponse.json();

		// Get streams data
		const streamsResponse = await fetch(
			`https://api.twitch.tv/helix/streams?${usersData.data
				.map((user: TwitchUser) => `user_id=${user.id}`)
				.join("&")}`,
			{
				headers: {
					"Client-ID": TWITCH_CLIENT_ID!,
					Authorization: `Bearer ${access_token}`,
				},
			},
		);
		const streamsData = await streamsResponse.json();

		// Combine user and stream data
		const combinedData = usersData.data.map((user: TwitchUser) => {
			const streamData = streamsData.data.find(
				(stream: { user_id: string }) => stream.user_id === user.id,
			);
			return {
				user_name: user.login,
				profile_image_url: user.profile_image_url,
				is_live: !!streamData,
				...(streamData && {
					title: streamData.title,
					thumbnail_url: streamData.thumbnail_url,
					viewer_count: streamData.viewer_count,
				}),
			};
		});

		return NextResponse.json(combinedData);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch streams" },
			{ status: 500 },
		);
	}
}
