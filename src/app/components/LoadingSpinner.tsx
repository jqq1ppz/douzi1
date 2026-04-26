import { GiCrossedSwords } from "react-icons/gi";

export default function LoadingSpinner() {
	return (
		<div className="flex justify-center items-center min-h-screen bg-gray-900">
			<div className="relative">
				<div className="w-16 h-16 rounded-lg border-4 border-purple-500/20 animate-[spin_2s_linear_infinite]">
					<div className="absolute inset-0.5 bg-gradient-to-tr from-purple-600 to-pink-600 rounded blur-sm" />
					<div className="absolute inset-1 bg-gradient-to-tr from-purple-600 to-pink-600 rounded" />
				</div>
				<div className="absolute -inset-2 flex items-center justify-center">
					<GiCrossedSwords className="w-6 h-6 text-white animate-pulse" />
				</div>
			</div>
		</div>
	);
}
