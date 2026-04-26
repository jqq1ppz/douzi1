interface StreamProps {
	stream: {
		user_name: string;
		profile_image_url: string;
		id: string;
	};
	playerName?: string;
	userAccessToken?: string;
}

export default function TwitchOfflineStream({
	stream,
	playerName,
}: StreamProps) {
	return (
		<a
			href={`https://www.twitch.tv/${stream.user_name}`}
			target="_blank"
			rel="noopener noreferrer"
			className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group relative"
		>
			<div className="relative">
				<img
					src={stream.profile_image_url}
					alt={stream.user_name}
					className="w-10 h-10 rounded-full"
				/>
			</div>
			<span className="text-gray-800 dark:text-gray-200">
				{stream.user_name}
			</span>
			{playerName && (
				<span className="text-sm text-purple-500 dark:text-purple-400">
					{playerName}
				</span>
			)}
		</a>
	);
}
