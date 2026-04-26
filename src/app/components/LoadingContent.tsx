interface Props {
	width?: string;
	height?: string;
	className?: string;
}

export default function LoadingContent({
	width = "w-[650px]",
	height = "h-[205px]",
	className = "",
}: Props) {
	return (
		<div
			className={`
				${width}
				${height}
				${className}
				relative
				overflow-hidden
				bg-gradient-to-r from-gray-700/30 via-gray-500/30 to-gray-700/30
				bg-[length:1300px_100%]
				animate-[placeholderShimmer_1.7s_linear_infinite]
				rounded
			`}
		/>
	);
}
