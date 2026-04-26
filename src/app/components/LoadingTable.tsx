interface Props {
	rows?: number;
	className?: string;
}

export default function LoadingTable({ rows = 5, className = "" }: Props) {
	return (
		<div className={`w-full ${className}`}>
			{[...Array(rows)].map((_, rowIndex) => (
				<div
					key={`row-${rowIndex}`}
					className="grid grid-cols-4 gap-4 py-4 border-b border-purple-500/10 hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-pink-500/5 transition-all duration-300"
				>
					{/* Rank */}
					<div className="flex justify-center">
						<div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-700/30 via-gray-500/30 to-gray-700/30 bg-[length:1300px_100%] animate-[placeholderShimmer_1.7s_linear_infinite]" />
					</div>

					{/* Player Name */}
					<div className="w-32 h-6 mx-auto bg-gradient-to-r from-gray-700/30 via-gray-500/30 to-gray-700/30 bg-[length:1300px_100%] animate-[placeholderShimmer_1.7s_linear_infinite] rounded" />

					{/* Balance */}
					<div className="w-24 h-6 mx-auto bg-gradient-to-r from-gray-700/30 via-gray-500/30 to-gray-700/30 bg-[length:1300px_100%] animate-[placeholderShimmer_1.7s_linear_infinite] rounded" />

					{/* Rounds */}
					<div className="w-16 h-6 mx-auto bg-gradient-to-r from-gray-700/30 via-gray-500/30 to-gray-700/30 bg-[length:1300px_100%] animate-[placeholderShimmer_1.7s_linear_infinite] rounded" />
				</div>
			))}
		</div>
	);
}
