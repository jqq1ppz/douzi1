interface StreamProps {
	stream: {
		platform: "youtube" | "kuaishou";
		channel_id: string;
		channel_name?: string;
		thumbnail_url?: string;
		title?: string;
	};
	playerName?: string;
}

export default function OtherStreamPlatforms({
	stream,
	playerName,
}: StreamProps) {
	const getPlatformUrl = () => {
		switch (stream.platform) {
			case "youtube":
				return `https://www.youtube.com/channel/${stream.channel_id}`;
			case "kuaishou":
				return `https://live.kuaishou.com/u/${stream.channel_id}`;
			default:
				return "#";
		}
	};

	const getPlatformColor = () => {
		switch (stream.platform) {
			case "youtube":
				return "text-red-500 dark:text-red-400";
			case "kuaishou":
				return "text-orange-500 dark:text-orange-400";
			default:
				return "text-gray-500 dark:text-gray-400";
		}
	};

	const getDefaultAvatar = (channelId: string) => {
		// Use 'retro' for gaming-style pixel art
		return `https://www.gravatar.com/avatar/${channelId}?d=retro&s=80`;
	};

	return (
		<a
			href={getPlatformUrl()}
			target="_blank"
			rel="noopener noreferrer"
			className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group relative"
		>
			<div className="relative">
				<img
					src={stream.thumbnail_url || getDefaultAvatar(stream.channel_id)}
					alt={stream.channel_id}
					className="w-10 h-10 rounded-full"
				/>
			</div>
			<span className="text-gray-800 dark:text-gray-200">
				{stream.channel_id}
			</span>
			{playerName && <span className={getPlatformColor()}>{playerName}</span>}
			<span className="text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
				{stream.platform}
			</span>
		</a>
	);
}
