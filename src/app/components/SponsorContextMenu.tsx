import { useState } from "react";
import Modal from "./Modal";

interface SponsorContextMenuProps {
	x: number;
	y: number;
	playerName: string;
	onClose: () => void;
	onAddSponsor: (playerName: string, sponsorName: string) => void;
}

export default function SponsorContextMenu({
	x,
	y,
	playerName,
	onClose,
	onAddSponsor,
}: SponsorContextMenuProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [sponsorName, setSponsorName] = useState("");

	const handleAddSponsor = () => {
		if (sponsorName.trim()) {
			onAddSponsor(playerName, sponsorName.trim());
			setIsModalOpen(false);
			onClose();
		}
	};

	return (
		<>
			<div
				className="fixed z-50 bg-gray-800 border border-purple-500/20 rounded-lg shadow-lg py-1"
				style={{ top: y, left: x }}
			>
				<button
					onClick={() => setIsModalOpen(true)}
					className="w-full px-4 py-2 text-left hover:bg-gray-700 text-sm"
				>
					Add Sponsor
				</button>
			</div>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title={`Add Sponsor for ${playerName}`}
			>
				<div className="space-y-4">
					<input
						type="text"
						value={sponsorName}
						onChange={e => setSponsorName(e.target.value)}
						placeholder="Enter sponsor name"
						className="w-full px-3 py-2 bg-gray-700 rounded-lg"
						autoFocus
					/>
					<button
						onClick={handleAddSponsor}
						className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
					>
						Add Sponsor
					</button>
				</div>
			</Modal>
		</>
	);
}
