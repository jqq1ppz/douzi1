import React from "react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import AddPlayerModal from "./AddPlayerModal";
import { FaFlag } from "react-icons/fa";
import { customToast } from "../utils/toast";

import { ImSpinner8 } from "react-icons/im";
import { playersToHide } from "../constants/playersToHide";

import { MAP_CATEGORIES } from "../constants/maps";

interface Props {
	onAddGame: (
		winners: string[],
		losers: string[],
		isSurrendered: boolean,
		submitterName: string,
		sponsorships: SponsorshipInput[],
		map?: string | null,
		amount?: number,
	) => Promise<void>;
	gameDayGames: { winners: string[]; losers: string[] }[];
	gameDayId: string;
	submitterName: string;
	sponsorships: Record<string, string>;
}

type Player = {
	id: string;
	name: string;
};

type CustomSession = {
	user?: {
		username: string;
		name?: string | null;
		role?: "USER" | "MODERATOR" | "ADMIN";
		id?: string;
	} | null;
};

interface SponsorshipInput {
	playerName: string;
	sponsorName: string;
	percentage: number;
}

interface SponsorshipPair {
	playerId: string;
	sponsorName: string;
}

const GAME_WON_AMOUNTS = [50, 75, 100, 150, 200];

export default function GameRecorder({
	onAddGame,
	gameDayGames,
	gameDayId,
	submitterName,
	sponsorships,
}: Props) {
	const { data: session } = useSession() as { data: CustomSession | null };
	const [teamA, setTeamA] = useState<string[]>([]);
	const [teamB, setTeamB] = useState<string[]>([]);
	const [isTeamAWinners, setIsTeamAWinners] = useState(true);
	const [winners, setWinners] = useState<string[]>([]);
	const [losers, setLosers] = useState<string[]>([]);
	const [isSurrendered, setIsSurrendered] = useState(false);
	const [selectedMap, setSelectedMap] = useState<string>("");
	const [customMap, setCustomMap] = useState<string>("");
	const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);
	const [players, setPlayers] = useState<Player[]>([]);
	const [currentUI, setCurrentUI] = useState(1);
	const [userRole, setUserRole] = useState<string | null>(null);
	const [selectedAmount, setSelectedAmount] = useState<number>(50);

	// Add state for active tab
	const [activeMapTab, setActiveMapTab] =
		useState<keyof typeof MAP_CATEGORIES>("4v4");

	const showAllPlayers = true;

	console.log(userRole);

	const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

	// Add this near your other state declarations
	const [sponsorOptions, setSponsorOptions] = useState<string[]>([]);

	// Add this near your other state declarations in GameRecorder component
	const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);

	// Add this useEffect to update sponsor options whenever players list changes
	useEffect(() => {
		const options = [...players.map(player => player.name)].sort(); // Sort alphabetically
		setSponsorOptions(options);
	}, [players]);

	// Force Team A to be winners initially
	useEffect(() => {
		setIsTeamAWinners(true);
		setWinners(teamA);
		setLosers(teamB);
	}, [teamA, teamB]);

	useEffect(() => {
		setIsLoadingPlayers(true);
		if (showAllPlayers) {
			fetch("/api/players")
				.then(res => res.json())
				.then(data => {
					setPlayers(data);
					setIsLoadingPlayers(false);
				})
				.catch(error => {
					console.error("Failed to fetch players:", error);
					setIsLoadingPlayers(false);
				});
		} else {
			getRecentPlayers();
		}
	}, [showAllPlayers]);

	const getRecentPlayers = async () => {
		try {
			const response = await fetch("/api/players/recent");
			const data = await response.json();
			setPlayers(data);
		} catch (error) {
			console.error("Failed to fetch recent players:", error);
		}
	};

	useEffect(() => {
		const loadUserRole = async () => {
			if (session?.user?.username) {
				try {
					const response = await fetch(`/api/users/role`);
					if (response.ok) {
						const data = await response.json();
						setUserRole(data.role);
						console.log("User role from API:", data.role);
					}
				} catch (error) {
					console.error("Failed to load user role:", error);
				}
			}
		};

		loadUserRole();
	}, [session?.user?.username, session?.user?.role]);

	useEffect(() => {
		const loadUserPreference = async () => {
			if (session?.user?.username) {
				try {
					const response = await fetch(`/api/users/preference`);
					if (response.ok) {
						const data = await response.json();
						console.log("Loaded UI preference:", data); // Debug log
						setCurrentUI(data.uiPreference);
					}
				} catch (error) {
					console.error("Failed to load UI preference:", error);
				}
			}
		};

		loadUserPreference();
	}, [session?.user?.username, session?.user?.role]);

	// Update preference when UI changes
	const handleUIChange = async (newUI: number) => {
		setCurrentUI(newUI);
		if (session?.user?.username) {
			try {
				const response = await fetch("/api/users/preference", {
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ uiPreference: newUI }),
				});
				const data = await response.json();
				console.log("Saved UI preference:", data); // Debug log
			} catch (error) {
				console.error("Failed to save UI preference:", error);
			}
		}
	};

	const handleTeamClick = (player: string, isTeamA: boolean) => {
		console.log("Team click - Player:", player, "Team A:", isTeamA);
		event?.preventDefault();

		if (isTeamA) {
			if (teamA.includes(player)) {
				const newTeamA = teamA.filter(p => p !== player);
				setTeamA(newTeamA);
				if (isTeamAWinners) {
					setWinners(newTeamA);
				} else {
					setLosers(newTeamA);
				}
			} else if (!teamB.includes(player) && teamA.length < 4) {
				const newTeamA = [...teamA, player];
				setTeamA(newTeamA);
				if (isTeamAWinners) {
					setWinners(newTeamA);
				} else {
					setLosers(newTeamA);
				}
			}
		} else {
			if (teamB.includes(player)) {
				const newTeamB = teamB.filter(p => p !== player);
				setTeamB(newTeamB);
				if (isTeamAWinners) {
					setLosers(newTeamB);
				} else {
					setWinners(newTeamB);
				}
			} else if (!teamA.includes(player) && teamB.length < 4) {
				const newTeamB = [...teamB, player];
				setTeamB(newTeamB);
				if (isTeamAWinners) {
					setLosers(newTeamB);
				} else {
					setWinners(newTeamB);
				}
			}
		}
	};

	const handleSubmit = async () => {
		try {
			const sponsorshipsArray = Object.entries(sponsorships)
				.filter(([_, sponsorName]) => sponsorName)
				.map(([playerName, sponsorName]) => ({
					playerName,
					sponsorName,
					percentage: 100,
				}));

			console.log("Formatted sponsorships array:", sponsorshipsArray);

			await onAddGame(
				winners,
				losers,
				isSurrendered,
				submitterName,
				sponsorshipsArray,
				selectedMap || customMap || null,
				selectedAmount,
			);

			// Reset form
			setWinners([]);
			setLosers([]);
			setTeamA([]);
			setTeamB([]);
			setIsSurrendered(false);
			setSelectedMap("");
			setCustomMap("");
			setSelectedAmount(50);
		} catch (error) {
			console.error("Error submitting game:", error);
			customToast.error("Failed to submit game");
		}
	};

	const handleAddWinner = async (playerName: string) => {
		try {
			if (!winners.includes(playerName)) {
				setWinners([...winners, playerName]);
				// Refresh players list
				const response = await fetch("/api/players");
				const updatedPlayers = await response.json();
				setPlayers(updatedPlayers);
				customToast.success(`${playerName} added successfully`);
			}
		} catch (error) {
			console.error("Error adding winner:", error);
			customToast.error(`Failed to add ${playerName}`);
		}
	};

	const setTeamAAsWinners = () => {
		setWinners(teamA);
		setLosers(teamB);
		setIsTeamAWinners(true);
	};

	const setTeamBAsWinners = () => {
		setWinners(teamB);
		setLosers(teamA);
		setIsTeamAWinners(false);
	};

	const getRecordedPlayers = () => {
		const recordedSet = new Set<string>();
		gameDayGames.forEach(game => {
			game.winners.forEach(player => recordedSet.add(player));
			game.losers.forEach(player => recordedSet.add(player));
		});
		return recordedSet;
	};

	const renderPlayerButtons = (isTeamA: boolean) => {
		const recordedPlayers = getRecordedPlayers();
		const filteredPlayers = players.filter(
			player => !playersToHide.includes(player.name),
		);
		const recordedPlayersList = filteredPlayers.filter(player =>
			recordedPlayers.has(player.name),
		);
		const unrecordedPlayersList = filteredPlayers.filter(
			player => !recordedPlayers.has(player.name),
		);
		const sortedPlayers = [...recordedPlayersList, ...unrecordedPlayersList];
		// Determine if this is the winners or losers list for key differentiation
		const keyType = isTeamA === isTeamAWinners ? "winners" : "losers";

		return (
			<div className="flex flex-wrap gap-2">
				{sortedPlayers.map((player, index) => (
					<React.Fragment key={`${player.id}-${keyType}-${index}`}>
						{index === recordedPlayersList.length &&
							recordedPlayersList.length > 0 && (
								<div className="w-full h-4"></div>
							)}
						<button
							type="button"
							onClick={() => handleTeamClick(player.name, isTeamA)}
							className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
								(isTeamA ? teamA : teamB).includes(player.name)
									? (isTeamA ? isTeamAWinners : !isTeamAWinners)
										? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg hover:shadow-green-500/25"
										: "bg-gradient-to-r from-red-600 to-red-500 text-white shadow-lg hover:shadow-red-500/25"
									: (isTeamA ? teamB : teamA).includes(player.name)
									? "bg-gray-800/50 text-gray-400 cursor-not-allowed"
									: recordedPlayers.has(player.name)
									? "bg-gray-800/80 hover:bg-gray-700/80 text-gray-200 hover:text-white shadow-lg hover:shadow-purple-500/10"
									: "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
							}`}
						>
							{player.name}
						</button>
					</React.Fragment>
				))}
			</div>
		);
	};

	const renderLoadingSpinner = () => (
		<div className="flex items-center justify-center p-8 rounded-lg bg-gray-800/50">
			<ImSpinner8 className="w-8 h-8 text-purple-500 animate-spin" />
		</div>
	);

	const renderUI1 = () => (
		<>
			<div>
				<h3 className="font-bold mb-2 dark:text-white">Winners*</h3>
				{isLoadingPlayers ? renderLoadingSpinner() : renderPlayerButtons(true)}
			</div>

			<div>
				<h3 className="font-bold mt-4 my-2 dark:text-white">Losers*</h3>
				{isLoadingPlayers ? renderLoadingSpinner() : renderPlayerButtons(false)}
			</div>
		</>
	);

	const renderUI2 = () => (
		<div className="flex flex-col md:flex-row gap-4 md:gap-8">
			{isLoadingPlayers ? (
				<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
					{renderLoadingSpinner()}
					{renderLoadingSpinner()}
				</div>
			) : (
				<>
					<div
						className={`w-full md:flex-1 relative p-4 pt-6 rounded-lg bg-gray-800/30 backdrop-blur-sm border-2 ${
							isTeamAWinners
								? "border-green-500/50 shadow-lg shadow-green-500/20"
								: "border-red-500/50 shadow-lg shadow-red-500/20"
						}`}
					>
						<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
							<span
								className={`${
									isTeamAWinners
										? "bg-gradient-to-r from-green-600 to-green-500"
										: "bg-gradient-to-r from-red-600 to-red-500"
								} text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg`}
							>
								{isTeamAWinners ? "Winners" : "Losers"}
							</span>
						</div>
						{renderPlayerButtons(true)}
						{!isTeamAWinners && teamA.length > 0 && (
							<button
								type="button"
								onClick={setTeamAAsWinners}
								className="w-full px-3 py-2 mt-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-bold shadow-lg hover:from-green-700 hover:to-green-600 transition-all duration-200"
							>
								Set as Winners
							</button>
						)}
					</div>

					<div
						className={`w-full md:flex-1 relative p-4 pt-6 rounded-lg bg-gray-800/30 backdrop-blur-sm border-2 ${
							!isTeamAWinners
								? "border-green-500/50 shadow-lg shadow-green-500/20"
								: "border-red-500/50 shadow-lg shadow-red-500/20"
						}`}
					>
						<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
							<span
								className={`${
									!isTeamAWinners
										? "bg-gradient-to-r from-green-600 to-green-500"
										: "bg-gradient-to-r from-red-600 to-red-500"
								} text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg`}
							>
								{!isTeamAWinners ? "Winners" : "Losers"}
							</span>
						</div>
						{renderPlayerButtons(false)}
						{isTeamAWinners && teamB.length > 0 && (
							<button
								type="button"
								onClick={setTeamBAsWinners}
								className="w-full px-3 py-2 mt-4 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-bold shadow-lg hover:from-green-700 hover:to-green-600 transition-all duration-200"
							>
								Set as Winners
							</button>
						)}
					</div>
				</>
			)}
		</div>
	);

	const handleAddPlayer = async (playerName: string) => {
		// Refresh players list after adding
		const updatedPlayersRes = await fetch("/api/players");
		const updatedPlayers = await updatedPlayersRes.json();
		setPlayers(updatedPlayers);
	};

	return (
		<div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 shadow-lg">
			<h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
				Record Game
			</h2>

			<div className="mt-6 space-y-6">
				{/* Add this before the UI Selection section */}
				<div className="mb-6 flex justify-start">
					<button
						onClick={() => setIsAddPlayerModalOpen(true)}
						className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500
						hover:from-purple-600 hover:to-pink-600 text-white rounded-lg
						font-medium transition-all duration-200 flex items-center gap-2
						shadow-lg hover:shadow-purple-500/25"
					>
						<span className="text-lg">+</span>
						<span>Add Player</span>
					</button>
				</div>

				{/* UI Selection */}
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2">
						<input
							type="radio"
							id="ui1"
							checked={currentUI === 1}
							onChange={() => handleUIChange(1)}
							className="w-4 h-4 cursor-pointer accent-purple-500"
						/>
						<label htmlFor="ui1" className="text-purple-200 cursor-pointer">
							Quick Result UI
						</label>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="radio"
							id="ui2"
							checked={currentUI === 2}
							onChange={() => handleUIChange(2)}
							className="w-4 h-4 cursor-pointer accent-purple-500"
						/>
						<label htmlFor="ui2" className="text-purple-200 cursor-pointer">
							Live Match UI
						</label>
					</div>
				</div>

				{/* Game Recording UI */}
				<div className={currentUI === 1 ? "pt-0" : "pt-8"}>
					{currentUI === 1 ? renderUI1() : renderUI2()}
				</div>

				{/* Map Selection */}
				<div className="space-y-4">
					<div className="flex flex-col gap-4">
						<h3 className="font-bold text-white">Map Selection*</h3>

						{/* Map Category Tabs */}
						<div className="flex flex-wrap gap-2">
							{(
								Object.keys(MAP_CATEGORIES) as (keyof typeof MAP_CATEGORIES)[]
							).map(category => (
								<button
									key={`category-${category}`}
									type="button"
									onClick={() => setActiveMapTab(category)}
									className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
										activeMapTab === category
											? "bg-gray-900 text-white shadow-lg border-b-2 border-purple-500"
											: "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
									}`}
								>
									{category}
								</button>
							))}
						</div>

						{/* Map Buttons */}
						<div className="flex flex-wrap gap-2">
							{MAP_CATEGORIES[activeMapTab].map((map, idx) => (
								<button
									type="button"
									key={`map-${map}-${idx}`}
									onClick={() => {
										setSelectedMap(map);
										setCustomMap("");
									}}
									className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
										selectedMap === map
											? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
											: "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
									}`}
								>
									{map}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Game Amount */}
				<div className="space-y-4">
					<h3 className="font-bold text-white">Game Amount*</h3>
					<div className="flex flex-wrap gap-2">
						{GAME_WON_AMOUNTS.map((amount, idx) => (
							<button
								type="button"
								key={`amount-${amount}-${idx}`}
								onClick={() => setSelectedAmount(amount)}
								className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
									selectedAmount === amount
										? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
										: "bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 hover:text-white"
								}`}
							>
								¥{amount}
							</button>
						))}
					</div>
				</div>

				{/* Surrendered Checkbox */}
				<div className="flex items-center gap-3 py-2">
					<input
						type="checkbox"
						id="surrendered"
						checked={isSurrendered}
						onChange={e => setIsSurrendered(e.target.checked)}
						className="w-5 h-5 rounded-md bg-gray-800 border-gray-700 text-purple-500 focus:ring-purple-500 cursor-pointer"
					/>
					<label
						htmlFor="surrendered"
						className="text-gray-200 flex items-center gap-2 cursor-pointer"
					>
						<FaFlag className="w-4 h-4 text-white/80" />
						<span className="font-medium">Surrendered</span>
					</label>
				</div>

				{/* Submit Button */}
				<button
					type="button"
					onClick={handleSubmit}
					disabled={
						!!session &&
						(winners.length === 0 ||
							losers.length === 0 ||
							winners.length !== losers.length ||
							winners.length > 4 ||
							(!selectedMap && !customMap))
					}
					className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg disabled:from-gray-700 disabled:to-gray-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg hover:shadow-purple-500/25"
				>
					{session ? "Submit Results" : "Login to Submit Results"}
				</button>
			</div>

			<AddPlayerModal
				isOpen={isWinnerModalOpen}
				onClose={() => setIsWinnerModalOpen(false)}
				onAdd={handleAddWinner}
				title="Add Player"
			/>

			<AddPlayerModal
				isOpen={isAddPlayerModalOpen}
				onClose={() => setIsAddPlayerModalOpen(false)}
				onAdd={handleAddPlayer}
				title="Add New Player"
			/>
		</div>
	);
}
