import { FaInfoCircle } from "react-icons/fa";
import { useState } from "react";

declare global {
	interface Window {
		Twitch: {
			Embed: new (elementId: string, options: any) => void;
		};
	}
}

export interface GameDayBroadcast {
	id: string;
	title: string;
	user_name: string;
	thumbnail_url: string;
	created_at: string;
	profile_image_url: string;
	view_count: number;
}

interface Props {
	broadcasts: GameDayBroadcast[];
}

export default function Broadcasts({ broadcasts }: Props) {
	const [hoveredBroadcastId, setHoveredBroadcastId] = useState<string | null>(
		null,
	);

	return (
		<div className="mt-8">
			<div className="flex justify-between items-center mb-6">
				<h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
					Broadcasts
				</h2>
			</div>
			<div className="flex pl-2 items-center mb-4">
				<p className="text-sm italic text-gray-500 dark:text-gray-300">
					In order for your streams to be displayed, ensure the stream title
					includes any of the following keywords: 🫘, 豆, or 豆子. Stream titles
					like 巅峰赛 or 歼灭 will not be displayed here.
				</p>
			</div>
			{broadcasts.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{broadcasts.map(broadcast => {
						const thumbnailUrl = broadcast.thumbnail_url
							.replace("{width}", "300")
							.replace("{height}", "300");

						return (
							<div
								key={broadcast.id}
								className="relative block bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border border-purple-500/20 shadow-lg rounded-lg overflow-hidden transition-all duration-300 group hover:border-purple-500/40"
								onMouseEnter={() => {
									setHoveredBroadcastId(broadcast.id);
									setTimeout(() => {
										const embedElement = document.getElementById(
											`twitch-embed-${broadcast.id}`,
										);
										if (
											window.Twitch &&
											embedElement &&
											!embedElement.hasChildNodes()
										) {
											new window.Twitch.Embed(`twitch-embed-${broadcast.id}`, {
												width: "100%",
												height: "100%",
												video: broadcast.id,
												autoplay: true,
												muted: true,
											});
										}
									}, 100);
								}}
								onMouseLeave={() => {
									setHoveredBroadcastId(null);
									const embedElement = document.getElementById(
										`twitch-embed-${broadcast.id}`,
									);
									if (embedElement) {
										embedElement.innerHTML = "";
									}
								}}
							>
								<div className="w-full h-48">
									{hoveredBroadcastId === broadcast.id ? (
										<div
											id={`twitch-embed-${broadcast.id}`}
											className="w-full h-full"
										></div>
									) : (
										<img
											src={thumbnailUrl}
											alt={broadcast.title}
											className="w-full h-48 object-cover"
											onError={e =>
												(e.currentTarget.src = "/path/to/fallback-image.jpg")
											}
										/>
									)}
								</div>
								<div className="p-4">
									<div className="flex items-center mb-2">
										<img
											src={broadcast.profile_image_url}
											alt={`${broadcast.user_name} profile`}
											className="w-10 h-10 rounded-full mr-2"
										/>
										<div>
											<h3 className="text-lg font-bold text-gray-200">
												{broadcast.user_name}
											</h3>
											<p className="text-sm text-gray-500">
												{new Date(broadcast.created_at).toLocaleDateString()}
											</p>
										</div>
									</div>
									<p className="text-gray-400">{broadcast.title}</p>
								</div>
							</div>
						);
					})}
				</div>
			) : (
				<p className="text-gray-400">No relevant broadcasts found.</p>
			)}
		</div>
	);
}
