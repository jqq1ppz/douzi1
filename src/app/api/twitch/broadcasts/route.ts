import { NextResponse } from "next/server";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

interface TwitchUser {
	id: string;
	login: string;
	profile_image_url: string;
}

interface BroadcastData {
	id: string;
	title: string;
	user_name: string;
	thumbnail_url: string;
	created_at: string;
	// Add other properties as needed
}

export async function POST(request: Request) {
	try {
		const { channels } = await request.json();

		// Get App Access Token
		const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
		});
		const tokenData = await tokenResponse.json();
		const access_token = tokenData.access_token;

		if (!access_token) {
			console.error("Failed to obtain access token:", tokenData);
			return NextResponse.json(
				{ error: "Failed to obtain access token" },
				{ status: 500 },
			);
		}

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

		if (!usersData.data || usersData.data.length === 0) {
			console.error(
				"No users found or unexpected user data format:",
				usersData,
			);
			return NextResponse.json({ error: "No users found" }, { status: 404 });
		}

		console.log("Users Data:", usersData);

		// Get recent broadcasts
		const broadcastsPromises = usersData.data.map((user: TwitchUser) =>
			fetch(
				`https://api.twitch.tv/helix/videos?user_id=${user.id}&type=archive`,
				{
					headers: {
						"Client-ID": TWITCH_CLIENT_ID!,
						Authorization: `Bearer ${access_token}`,
					},
				},
			).then(res => res.json()),
		);

		const broadcastsData = await Promise.all(broadcastsPromises);

		console.log("Broadcasts Data:", broadcastsData);

		// Combine user and broadcast data
		const combinedData = usersData.data.flatMap(
			(user: TwitchUser, index: number) => {
				const userBroadcasts = broadcastsData[index].data;
				return userBroadcasts
					.filter(
						(broadcast: { title: string }) =>
							user.login === "ra1neyy9" || /🫘|豆子|豆/.test(broadcast.title),
					)
					.map((broadcast: BroadcastData) => ({
						id: broadcast.id,
						user_name: user.login,
						profile_image_url: user.profile_image_url,
						title: broadcast.title,
						thumbnail_url: broadcast.thumbnail_url,
						created_at: broadcast.created_at,
					}));
			},
		);

		console.log("Combined Data:", combinedData);

		return NextResponse.json(combinedData);
	} catch (error) {
		console.error("Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch broadcasts" },
			{ status: 500 },
		);
	}
}
