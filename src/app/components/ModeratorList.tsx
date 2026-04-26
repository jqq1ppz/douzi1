import { useState, useEffect } from "react";
import { FaUserShield, FaTrash } from "react-icons/fa";
import { customToast } from "../utils/toast";
import Modal from "./Modal";

interface ModeratorListProps {
	onModeratorChange: () => void;
}

export default function ModeratorList({
	onModeratorChange,
}: ModeratorListProps) {
	const [moderators, setModerators] = useState<
		{ id: string; username: string }[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [errorModalOpen, setErrorModalOpen] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		fetchModerators();
	}, []);

	const fetchModerators = async () => {
		try {
			const response = await fetch("/api/users");
			const data = await response.json();
			const moderatorUsers = data.filter(
				(user: any) => user.role === "MODERATOR",
			);
			setModerators(moderatorUsers);
		} catch (error) {
			console.error("Error fetching moderators:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveModerator = async (userId: string) => {
		try {
			const response = await fetch("/api/users/role", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId,
					role: "USER",
				}),
			});

			if (response.ok) {
				setModerators(moderators.filter(m => m.id !== userId));
				if (onModeratorChange) {
					onModeratorChange();
				}
				customToast.success("Moderator removed successfully");
			} else {
				const error = await response.json();
				setErrorMessage(error.error || "Failed to remove moderator");
				setErrorModalOpen(true);
			}
		} catch (error) {
			console.error("Error removing moderator:", error);
			setErrorMessage("Failed to remove moderator");
			setErrorModalOpen(true);
		}
	};

	if (loading) {
		return <div className="text-gray-400">Loading moderators...</div>;
	}

	return (
		<div className="space-y-2">
			<h3 className="text-lg font-semibold text-white mb-4">
				Current Moderators
			</h3>
			{moderators.length === 0 ? (
				<p className="text-gray-400">No moderators found</p>
			) : (
				<div className="space-y-2">
					{moderators.map(moderator => (
						<div
							key={moderator.id}
							className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-purple-500/20"
						>
							<div className="flex items-center gap-2">
								<FaUserShield className="text-purple-400" />
								<span className="text-white">{moderator.username}</span>
							</div>
							<button
								onClick={() => handleRemoveModerator(moderator.id)}
								className="p-2 text-red-400 hover:text-red-300 transition-colors"
							>
								<FaTrash className="w-4 h-4" />
							</button>
						</div>
					))}
				</div>
			)}

			<Modal
				isOpen={errorModalOpen}
				onClose={() => setErrorModalOpen(false)}
				title="Error"
			>
				<div className="space-y-4">
					<p className="text-gray-200">{errorMessage}</p>
					<div className="flex justify-end">
						<button
							onClick={() => setErrorModalOpen(false)}
							className="px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-all duration-300 border border-gray-700"
						>
							Close
						</button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
