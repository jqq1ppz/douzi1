import { useState, useEffect } from "react";
import { FaStar, FaTrash } from "react-icons/fa";
import LoadingSpinner2 from "./LoadingSpinner2";
import { ImSpinner8 } from "react-icons/im";

interface Props {
	allPlayers: string[];
	onSponsorUpdate: (sponsorships: Record<string, string>) => void;
	gameDayId: string;
	gameStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
}

interface Player {
	id: string;
	name: string;
}

export default function AddGameSponsors({
	allPlayers,
	onSponsorUpdate,
	gameDayId,
	gameStatus,
}: Props) {
	const [sponsorships, setSponsorships] = useState<Record<string, string>>({});
	const sponsorOptions = [...allPlayers].sort();
	const [selectedPlayer, setSelectedPlayer] = useState<string>("");
	const [selectedSponsor, setSelectedSponsor] = useState<string>("");
	const [playerMap, setPlayerMap] = useState<Record<string, string>>({}); // name -> id mapping
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

	// Fetch players data to get their IDs
	useEffect(() => {
		const fetchPlayers = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/players");
				const data = await response.json();
				const nameToId = data.reduce(
					(acc: Record<string, string>, player: Player) => {
						acc[player.name] = player.id;
						return acc;
					},
					{},
				);
				setPlayerMap(nameToId);
			} catch (error) {
				console.error("Failed to fetch players:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPlayers();
	}, []);

	// Fetch existing sponsorships on mount
	useEffect(() => {
		const fetchSponsorships = async () => {
			try {
				const response = await fetch(`/api/gamedays/${gameDayId}`);
				const { data } = await response.json();
				if (data && data.GameSponsorship) {
					const sponsorMap = data.GameSponsorship.reduce(
						(acc: Record<string, string>, curr: any) => {
							acc[curr.player.name] = curr.sponsorName;
							return acc;
						},
						{},
					);
					setSponsorships(sponsorMap);
					onSponsorUpdate(sponsorMap);
				}
			} catch (error) {
				console.error("Failed to fetch sponsorships:", error);
			}
		};

		if (gameDayId) {
			fetchSponsorships();
		}
	}, [gameDayId]);

	useEffect(() => {
		setIsLoadingPlayers(true);
		if (allPlayers) {
			setIsLoadingPlayers(false);
		}
	}, [allPlayers]);

	const handleSponsorChange = async (
		playerName: string,
		sponsorName: string,
	) => {
		if (!playerName) return;

		const playerId = playerMap[playerName];
		if (!playerId) {
			console.error("Could not find player ID for:", playerName);
			return;
		}

		try {
			const response = await fetch("/api/sponsorships", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					playerId,
					sponsorName: sponsorName || null,
					gameDayId,
				}),
			});

			if (response.ok) {
				const newSponsorships = {
					...sponsorships,
					[playerName]: sponsorName,
				};
				if (!sponsorName) {
					delete newSponsorships[playerName];
				}
				setSponsorships(newSponsorships);
				onSponsorUpdate(newSponsorships);
				// Reset selections after successful add
				setSelectedPlayer("");
				setSelectedSponsor("");
			} else {
				console.error("Failed to update sponsorship");
			}
		} catch (error) {
			console.error("Error updating sponsorship:", error);
		}
	};

	const handleAddClick = () => {
		if (selectedPlayer && selectedSponsor) {
			handleSponsorChange(selectedPlayer, selectedSponsor);
		}
	};

	// Deduplicate players array
	const uniquePlayers = Array.from(new Set(allPlayers)).sort();

	return (
		<div className="">
			<h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
				Game Day Sponsorships
			</h2>
			{isLoading || isLoadingPlayers ? (
				<LoadingSpinner2 />
			) : (
				<>
					{gameStatus !== "COMPLETED" && (
						<div className="mt-4 space-y-4">
							<div className="flex flex-col gap-4">
								{/* Player Selection */}
								<div className="flex items-center gap-2">
									<span className="text-gray-400 font-medium min-w-[60px]">
										Player:
									</span>
									<select
										value={selectedPlayer}
										onChange={e => setSelectedPlayer(e.target.value)}
										className="flex-1 px-2 py-1 rounded-lg bg-gray-800/50 border border-yellow-500/10 text-gray-200 outline-none focus:border-yellow-500/30"
									>
										<option value="">Select Player</option>
										{uniquePlayers.map(player => (
											<option
												key={`player-${player}`}
												value={player}
												disabled={player in sponsorships}
											>
												{player}
											</option>
										))}
									</select>
								</div>

								{/* Sponsor Selection */}
								<div className="flex items-center gap-2">
									<span className="text-gray-400 font-medium min-w-[70px]">
										Sponsor:
									</span>
									<select
										value={selectedSponsor}
										onChange={e => setSelectedSponsor(e.target.value)}
										className="flex-1 px-2 py-1 rounded-lg bg-gray-800/50 border border-yellow-500/10 text-gray-200 outline-none focus:border-yellow-500/30"
									>
										<option value="">Select Sponsor</option>
										{sponsorOptions.map(sponsor => (
											<option
												key={sponsor}
												value={sponsor}
												className="text-gray-200"
											>
												{sponsor}
											</option>
										))}
									</select>
								</div>

								{/* Add Button */}
								<button
									onClick={handleAddClick}
									disabled={!selectedPlayer || !selectedSponsor || isLoading}
									className="w-full px-4 py-2 rounded-lg bg-yellow-500/70 text-white hover:bg-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
								>
									Add Sponsorship
								</button>
							</div>
						</div>
					)}

					{/* Current Sponsorships List */}
					{/* <div className="mt-6 space-y-2">
						{Object.entries(sponsorships).map(([player, sponsor]) => (
							<div
								key={`${player}-${sponsor}`}
								className="flex items-center justify-between gap-4 bg-gray-800/30 p-4 rounded-lg border border-yellow-500/10"
							>
								<div className="flex items-center gap-2">
									<span className="text-gray-300">{player}</span>
									<span className="text-gray-500">→</span>
									<span className="text-yellow-500">{sponsor}</span>
								</div>
								{gameStatus !== "COMPLETED" && (
									<button
										onClick={() => handleSponsorChange(player, "")}
										className="text-red-400 hover:text-red-300 transition-colors"
									>
										<FaTrash size={14} />
									</button>
								)}
							</div>
						))}
					</div> */}
				</>
			)}
		</div>
	);
}
