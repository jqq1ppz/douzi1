"use client";

import { useState, useEffect } from "react";
import TwitchLiveStream from "../components/TwitchLiveStream";
import TwitchOfflineStream from "../components/TwitchOfflineStream";
import { pinyin } from "pinyin-pro";
import { TWITCH_CHANNELS, PLAYER_NAMES } from "../constants/twitch";
import LoadingSpinner from "../components/LoadingSpinner";
import { KUAISHOU_CHANNELS } from "../constants/streamPlatforms";
import OtherStreamPlatforms from "../components/OtherStreamPlatforms";
import { YOUTUBE_CHANNELS } from "../constants/streamPlatforms";

// priority channels to be displayed“
const PRIORITY_CHANNELS = [
	"qdandanq",
	"fanks_ac",
	"trae677777",
	"ikkkkkkk1228",
	"zzxun1",
];

interface StreamData {
	id: string;
	user_name: string;
	title: string;
	thumbnail_url: string;
	viewer_count: number;
	is_live: boolean;
	profile_image_url: string;
	recent_broadcasts: { thumbnail_url: string; title: string }[];
}

export default function StreamsPage() {
	const [streams, setStreams] = useState<StreamData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStreams = async () => {
			try {
				const response = await fetch("/api/twitch/streams", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ channels: TWITCH_CHANNELS }),
				});
				const data: StreamData[] = await response.json();
				const streamsWithId = data.map((stream: StreamData) => ({
					id: stream.id,
					user_name: stream.user_name,
					title: stream.title,
					thumbnail_url: stream.thumbnail_url,
					viewer_count: stream.viewer_count,
					is_live: stream.is_live,
					profile_image_url: stream.profile_image_url,
					recent_broadcasts: stream.recent_broadcasts || [],
				}));
				setStreams(streamsWithId);
			} catch (error) {
				console.error("Error fetching streams:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchStreams();
	}, []);

	const liveStreams = streams.filter(stream => stream.is_live);
	const offlineStreams = streams.filter(stream => !stream.is_live);

	if (loading) return <LoadingSpinner />;

	return (
		<div className="container mx-auto p-4">
			<div className="space-y-8">
				{/* Live Streams */}
				<section>
					<h2 className="text-2xl font-bold mb-4 dark:text-white">
						Live Channels
					</h2>
					{liveStreams.length > 0 ? (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{liveStreams.map(stream => (
								<TwitchLiveStream
									key={stream.user_name}
									stream={stream}
									playerName={PLAYER_NAMES[stream.user_name]}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-8 text-gray-600 dark:text-gray-400">
							No one is streaming right now. Check back later!
						</div>
					)}
				</section>

				{/* Offline Streams */}
				<section>
					<h2 className="text-2xl font-bold mb-4 dark:text-white">
						Offline Channels
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{offlineStreams
							.sort((a, b) => {
								// Handle priority channels
								const aPriority = PRIORITY_CHANNELS.indexOf(a.user_name);
								const bPriority = PRIORITY_CHANNELS.indexOf(b.user_name);

								// If both are priority channels, sort by their priority order
								if (aPriority !== -1 && bPriority !== -1) {
									return aPriority - bPriority;
								}

								// If only one is a priority channel, it goes first
								if (aPriority !== -1) return -1;
								if (bPriority !== -1) return 1;

								// For non-priority channels, sort by pinyin
								const pinyinA = pinyin(
									PLAYER_NAMES[a.user_name] || a.user_name,
									{ toneType: "none", type: "array" },
								).join("");
								const pinyinB = pinyin(
									PLAYER_NAMES[b.user_name] || b.user_name,
									{ toneType: "none", type: "array" },
								).join("");
								return pinyinA.localeCompare(pinyinB);
							})
							.map(stream => (
								<TwitchOfflineStream
									key={stream.user_name}
									stream={stream}
									playerName={PLAYER_NAMES[stream.user_name]}
								/>
							))}
					</div>
				</section>

				{/* Other Streaming Platforms */}
				<section>
					<h2 className="text-2xl font-bold mb-4 dark:text-white">
						Other Platforms
					</h2>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
						{/* Kuaishou Channels */}
						{Object.entries(KUAISHOU_CHANNELS).map(
							([playerName, channelId]) => (
								<OtherStreamPlatforms
									key={`kuaishou-${playerName}-${channelId}`}
									stream={{ platform: "kuaishou", channel_id: channelId }}
									playerName={playerName}
								/>
							),
						)}

						{/* YouTube Channels */}
						{Object.entries(YOUTUBE_CHANNELS).map(([playerName, channelId]) => (
							<OtherStreamPlatforms
								key={`youtube-${playerName}-${channelId}`}
								stream={{ platform: "youtube", channel_id: channelId }}
								playerName={playerName}
							/>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}
