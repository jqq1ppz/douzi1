export default function ActiveGameCardSkeleton() {
	return (
		<div className="group relative overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

			<div className="p-6 border-2 border-purple-500/40 rounded-xl bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 backdrop-blur-sm relative overflow-hidden">
				<div className="relative grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="md:col-span-3">
						<div className="flex flex-col md:grid md:grid-cols-3 gap-x-4 gap-y-2">
							{/* Left Side - 2/3 width */}
							<div className="md:col-span-2">
								{/* Date and Status */}
								<div className="flex items-center gap-3">
									<div className="h-7 w-32 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
									<div className="h-6 w-24 bg-gradient-to-r from-yellow-900/60 to-yellow-800/60 rounded animate-pulse" />
								</div>

								{/* Stats */}
								<div className="flex items-center gap-4 mt-2">
									<div className="flex items-center gap-1">
										<div className="w-6 h-6 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded animate-pulse" />
										<div className="h-5 w-24 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
									</div>
									<div className="flex items-center gap-1">
										<div className="w-4 h-4 bg-gradient-to-r from-pink-500/30 to-purple-500/30 rounded animate-pulse" />
										<div className="h-5 w-20 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
									</div>
								</div>
							</div>

							{/* Right Side - 1/3 width */}
							<div className="text-right">
								<div className="space-y-2">
									<div className="flex items-center justify-end gap-2">
										<div className="w-4 h-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded animate-pulse" />
										<div className="h-5 w-32 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
									</div>
									<div className="flex items-center justify-end gap-2">
										<div className="w-4 h-4 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded animate-pulse" />
										<div className="h-5 w-28 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
									</div>
									<div className="flex items-center justify-end gap-2 mt-1">
										<div className="h-5 w-36 bg-gradient-to-r from-gray-800/60 to-gray-700/60 rounded animate-pulse" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
