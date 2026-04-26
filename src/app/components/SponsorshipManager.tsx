import { useState } from "react";
import { useSession } from "next-auth/react";

interface SponsorshipManagerProps {
	playerId: string;
	playerName: string;
	onSponsorshipUpdate: () => void;
}

export default function SponsorshipManager({
	playerId,
	playerName,
	onSponsorshipUpdate,
}: SponsorshipManagerProps) {
	const [sponsorName, setSponsorName] = useState("");
	const [percentage, setPercentage] = useState(100);
	const { data: session } = useSession();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		try {
			const response = await fetch("/api/sponsorships", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					playerId,
					sponsorName,
					percentage,
					sponsorId: null, // Can be updated to use system users if needed
				}),
			});

			if (!response.ok) throw new Error("Failed to create sponsorship");

			setSponsorName("");
			setPercentage(100);
			onSponsorshipUpdate();
		} catch (error) {
			console.error("Error creating sponsorship:", error);
		}
	};

	return (
		<div className="p-4 bg-gray-800 rounded-lg">
			<h3 className="text-lg font-semibold mb-4">
				Manage Sponsorship for {playerName}
			</h3>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1">Sponsor Name</label>
					<input
						type="text"
						value={sponsorName}
						onChange={e => setSponsorName(e.target.value)}
						className="w-full px-3 py-2 bg-gray-700 rounded-lg"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Percentage ({percentage}%)
					</label>
					<input
						type="range"
						min="1"
						max="100"
						value={percentage}
						onChange={e => setPercentage(Number(e.target.value))}
						className="w-full"
					/>
				</div>

				<button
					type="submit"
					className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
				>
					Add Sponsorship
				</button>
			</form>
		</div>
	);
}
