import { NextApiRequest, NextApiResponse } from "next";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;
const REDIRECT_URI = "http://localhost:3000/app/api/auth/callback"; // Update this to your actual redirect URI

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse,
) {
	const { code } = req.query;

	if (!code) {
		return res.status(400).json({ error: "Authorization code is missing" });
	}

	try {
		// Exchange the authorization code for an access token
		const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: new URLSearchParams({
				client_id: TWITCH_CLIENT_ID,
				client_secret: TWITCH_CLIENT_SECRET,
				code: code as string,
				grant_type: "authorization_code",
				redirect_uri: REDIRECT_URI,
			}),
		});

		const tokenData = await tokenResponse.json();
		if (tokenData.error) {
			throw new Error(tokenData.error_description);
		}

		const accessToken = tokenData.access_token;

		// Get user information
		const userResponse = await fetch("https://api.twitch.tv/helix/users", {
			headers: {
				"Client-ID": TWITCH_CLIENT_ID,
				Authorization: `Bearer ${accessToken}`,
			},
		});

		const userData = await userResponse.json();
		const userId = userData.data[0].id;

		// Store user information in session or database
		// For example, using a session:
		// req.session.user = { id: userId, accessToken };

		res.status(200).json({ userId, accessToken });
	} catch (error) {
		console.error("Error during authentication:", error);
		res.status(500).json({ error: "Failed to authenticate with Twitch" });
	}
}
