import { useState } from "react";
import { FaExpand } from "react-icons/fa";

interface StreamProps {
	stream: {
		user_name: string;
		title: string;
		thumbnail_url: string;
		viewer_count: number;
	};
	playerName?: string;
}

export default function TwitchLiveStream({ stream, playerName }: StreamProps) {
	const [isTheaterMode, setIsTheaterMode] = useState(false);

	const thumbnailUrl = stream.thumbnail_url
		.replace("{width}", "440")
		.replace("{height}", "248");

	return (
		<div className="block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow relative">
			<div className="relative">
				<a
					href={`https://www.twitch.tv/${stream.user_name}`}
					target="_blank"
					rel="noopener noreferrer"
				>
					<img
						src={thumbnailUrl}
						alt={stream.title}
						className="w-full aspect-video object-cover"
					/>
				</a>
				<div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
					<span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
					LIVE
				</div>
				<button
					onClick={() => setIsTheaterMode(true)}
					className="absolute bottom-2 right-2 text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-75"
				>
					<FaExpand className="w-4 h-4" />
				</button>
			</div>
			<div className="p-4">
				<h3 className="font-bold text-lg mb-1 dark:text-white">
					{stream.user_name} {playerName && `(${playerName})`}
				</h3>
				<p className="text-gray-600 dark:text-gray-300 text-sm">
					{stream.title}
				</p>
				<p className="text-purple-500 dark:text-purple-400 text-sm mt-2">
					{stream.viewer_count} viewers
				</p>
			</div>

			{isTheaterMode && (
				<div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
					<button
						onClick={() => setIsTheaterMode(false)}
						className="absolute top-4 right-4 text-white text-3xl font-bold bg-black bg-opacity-50 p-3 rounded-full hover:bg-opacity-75"
					>
						&times;
					</button>
					<div className="relative w-full max-w-4xl">
						<iframe
							src={`https://player.twitch.tv/?channel=${stream.user_name}&parent=douzi-app-production.up.railway.app`}
							height="500"
							width="100%"
							allowFullScreen
							className="w-full aspect-video"
						></iframe>
					</div>
				</div>
			)}
		</div>
	);
}
