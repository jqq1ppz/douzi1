export default function GameCardSkeleton() {
	return (
		<div className="group relative overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			<div className="relative p-4 md:p-6 rounded-xl backdrop-blur-sm border flex w-full items-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-purple-500/20 group-hover:border-purple-500/40 transition-all duration-300">
				{/* Left Section - Game Info */}
				<div className="min-w-[115px] md:min-w-[180px] w-[120px] md:w-[180px] relative">
					<div className="flex items-center gap-1.5 text-gray-200 font-bold mb-2">
						<div className="w-7 h-7 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full animate-pulse" />
						<div className="w-5 h-5 bg-gray-800/60 rounded-full animate-pulse" />
					</div>

					<div className="space-y-2 text-sm">
						<div className="h-4 w-32 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
						<div className="h-4 w-24 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
						<div className="h-4 w-28 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
					</div>
				</div>

				{/* Right Section - Winners & Losers */}
				<div className="flex-1 min-w-0 space-y-2  md:ml-8 relative -ml-3">
					<div className="flex items-center gap-1">
						<div className="w-5 h-5 bg-gray-800/60 rounded animate-pulse shrink-0" />
						<div className="h-5 w-3/4 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
					</div>
					<div className="flex items-center gap-1">
						<div className="w-5 h-5 bg-gray-800/60 rounded animate-pulse shrink-0" />
						<div className="h-5 w-2/3 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
					</div>
				</div>

				{/* Amount Badge */}
				<div className="absolute flex items-center justify-center bottom-3 right-6 h-7 w-10 rounded-lg bg-gradient-to-r from-gray-800/60 to-gray-700/60 animate-pulse" />
			</div>
		</div>
	);
}
