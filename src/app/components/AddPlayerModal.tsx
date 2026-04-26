import { useState } from "react";

interface AddPlayerModalProps {
	isOpen: boolean;
	onClose: () => void;
	onAdd: (playerName: string) => void;
	title: string;
}

export default function AddPlayerModal({
	isOpen,
	onClose,
	onAdd,
	title,
}: AddPlayerModalProps) {
	const [playerName, setPlayerName] = useState("");

	if (!isOpen) return null;

	const handleAdd = async () => {
		if (playerName.trim()) {
			try {
				const response = await fetch("/api/players", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ name: playerName.trim() }),
				});

				if (response.ok) {
					const newPlayer = await response.json();
					onAdd(newPlayer.name);
					setPlayerName("");
					onClose();
				} else {
					const error = await response.json();
					alert(error.error || "Failed to add player");
				}
			} catch (error) {
				console.error("Error adding player:", error);
				alert("Error adding player");
			}
		}
	};

	return (
		<div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
			<div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 rounded-xl shadow-xl border border-purple-500/20 w-96 transform transition-all">
				{/* Animated gradient border */}
				<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-gradient-xy" />

				<div className="relative">
					<h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
						{title}
					</h2>

					<div>
						<input
							type="text"
							value={playerName}
							onChange={e => setPlayerName(e.target.value)}
							placeholder="Enter player name"
							className="w-full p-3 bg-gray-900/50 border border-purple-500/20 rounded-lg mb-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-transparent transition-all"
							autoFocus
							onKeyPress={e => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAdd();
								}
							}}
						/>

						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={onClose}
								className="px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleAdd}
								className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-purple-500 disabled:hover:to-pink-500 shadow-lg hover:shadow-purple-500/25"
								disabled={!playerName.trim()}
							>
								Add
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
