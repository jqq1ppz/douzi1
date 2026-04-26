import { FaDiceD20 } from "react-icons/fa";
import { motion } from "framer-motion";

export default function NoActiveGame({
	onCreateGame,
}: {
	onCreateGame: () => void;
}) {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
				className="flex justify-center"
			>
				<button
					onClick={onCreateGame}
					className="group relative px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-bold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 hover:shadow-purple-500/25"
				>
					<span className="flex items-center gap-2">
						<FaDiceD20 className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
						Create New Game Day
					</span>
				</button>
			</motion.div>
		</div>
	);
}
