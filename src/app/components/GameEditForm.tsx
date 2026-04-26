import { useState, useEffect } from "react";
import { Game, GameSponsorship } from "../types";
import { MdSwapVert } from "react-icons/md";
import { FaStar } from "react-icons/fa";
import { MAP_CATEGORIES } from "../constants/maps";

interface GameWithSponsorships extends Game {
	sponsorships: GameSponsorship[];
}

interface Props {
	game: GameWithSponsorships;
	onSave: (
		winners: string[],
		losers: string[],
		gameType: "full" | "surrendered",
		amount: number,
		sponsorships: Record<string, string>,
		map: string | null,
	) => Promise<void>;
	onCancel: () => void;
	allPlayers: string[];
}

const GAME_AMOUNTS = [50, 75, 100, 150, 200];

// Use allPlayers prop to generate sponsor options
export default function GameEditForm({
	game,
	onSave,
	onCancel,
	allPlayers,
}: Props) {
	const [winners, setWinners] = useState<string[]>(game.winners);
	const [losers, setLosers] = useState<string[]>(game.losers);
	const [isSurrendered, setIsSurrendered] = useState(
		game.gameType === "surrendered",
	);
	const [selectedAmount, setSelectedAmount] = useState<number>(
		game.amount || 50,
	);
	const [sponsorships, setSponsorships] = useState<Record<string, string>>(
		() => {
			const initial: Record<string, string> = {};
			console.log("Game sponsorships:", game.sponsorships); // Debug log

			game.sponsorships?.forEach(s => {
				if (s.active && s.player) {
					initial[s.player.name] = s.sponsorName;
				}
			});

			console.log("Initial sponsorships:", initial); // Debug log
			return initial;
		},
	);
	const [selectedMap, setSelectedMap] = useState<string>(game.map || "");
	const [activeMapTab, setActiveMapTab] =
		useState<keyof typeof MAP_CATEGORIES>("4v4");

	// Combine current players with allPlayers for dropdown options
	const dropdownOptions = Array.from(
		new Set([...game.winners, ...game.losers, ...allPlayers]),
	).sort();

	// Generate sponsor options from allPlayers plus
	const sponsorOptions = [...allPlayers].sort();

	const handleSponsorChange = (playerName: string, sponsorName: string) => {
		setSponsorships(prev => ({ ...prev, [playerName]: sponsorName }));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const gameType = isSurrendered ? "surrendered" : "full";

		const filteredSponsorships = Object.fromEntries(
			Object.entries(sponsorships).filter(([_, value]) => value !== ""),
		);

		// Log the values being sent
		console.log("Submitting game edit with map:", selectedMap);

		onSave(
			winners,
			losers,
			gameType,
			selectedAmount,
			filteredSponsorships,
			selectedMap,
		);
	};

	const handleSwitchTeams = () => {
		const tempWinners = [...winners];
		setWinners(losers);
		setLosers(tempWinners);
	};

	const renderDropdowns = (isWinners: boolean) => {
		const team = isWinners ? winners : losers;
		const setTeam = isWinners ? setWinners : setLosers;
		const prefix = isWinners ? "winner" : "loser";

		return (
			<div className="grid grid-cols-2 gap-2">
				{[0, 1, 2, 3].map(index => (
					<select
						key={`${prefix}-${index}`}
						value={team[index] || ""}
						onChange={e => {
							const newTeam = [...team];
							if (e.target.value) {
								newTeam[index] = e.target.value;
							} else {
								newTeam.splice(index, 1);
							}
							setTeam(newTeam.filter(Boolean));
						}}
						className="w-full px-2 py-1 rounded-lg bg-gray-800/50 border border-purple-500/10 text-gray-200 outline-none focus:border-purple-500/30"
					>
						<option value="">Select Player</option>
						{dropdownOptions.map(player => (
							<option key={player} value={player}>
								{player}
							</option>
						))}
					</select>
				))}
			</div>
		);
	};

	// Add this helper function
	const isTeamsValid = () => {
		const winnersCount = winners.length;
		const losersCount = losers.length;
		return winnersCount === losersCount && winnersCount > 0;
	};

	// Add debug logging when map changes
	useEffect(() => {
		console.log("Selected map changed to:", selectedMap);
	}, [selectedMap]);

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Winners Section */}
			<div className="space-y-2">
				<h3 className="text-green-400 font-bold">Winners</h3>
				{renderDropdowns(true)}
			</div>

			{/* Switch Teams Button */}
			<button
				type="button"
				onClick={handleSwitchTeams}
				className="flex items-center justify-center w-full rounded-full transition-colors duration-200 group"
				title="Switch teams"
			>
				<MdSwapVert className="w-6 h-6 hover:scale-105 text-gray-400 group-hover:text-white transition-colors duration-200" />
			</button>

			{/* Losers Section */}
			<div className="space-y-2">
				<h3 className="text-red-400 font-bold">Losers</h3>
				{renderDropdowns(false)}
			</div>

			{/* Sponsorships Section */}
			<div className="space-y-3">
				<h3 className="text-yellow-500 font-bold flex items-center gap-2">
					<FaStar className="text-yellow-500" />
					Sponsorships
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
					{/* Winners Column */}
					<div className="space-y-1.5 md:border-r border-purple-500/10 pr-6">
						<h4 className="text-green-400 font-medium mb-2">Winners</h4>
						{winners.map(player => (
							<div key={player} className="flex items-center gap-2">
								<span className="text-gray-300 min-w-[80px] truncate">
									{player}
								</span>
								<span className="text-gray-500">→</span>
								<select
									value={sponsorships[player] || ""}
									onChange={e => handleSponsorChange(player, e.target.value)}
									className={`w-3/4 px-2 py-0.5 rounded-lg bg-gray-800/50 border border-purple-500/10 outline-none focus:border-purple-500/30
										${sponsorships[player] ? "text-yellow-500" : "text-gray-200"}`}
								>
									<option value="" className="text-gray-200">
										Select Sponsor
									</option>
									{sponsorOptions.map(sponsor => (
										<option
											key={sponsor}
											value={sponsor}
											className={
												sponsorships[player] === sponsor
													? "text-yellow-500"
													: "text-gray-200"
											}
										>
											Sponsored by: {sponsor}
										</option>
									))}
								</select>
							</div>
						))}
					</div>

					{/* Losers Column */}
					{
						<div className="space-y-1.5 md:pl-2 pr-6">
							<h4 className="text-red-400 font-medium mb-2">Losers</h4>
							{losers.map(player => (
								<div key={player} className="flex items-center gap-2">
									<span className="text-gray-300 min-w-[80px] truncate">
										{player}
									</span>
									<span className="text-gray-500">→</span>
									<select
										value={sponsorships[player] || ""}
										onChange={e => handleSponsorChange(player, e.target.value)}
										className={`w-3/4 px-2 py-0.5 rounded-lg bg-gray-800/50 border border-purple-500/10 outline-none focus:border-purple-500/30
											${sponsorships[player] ? "text-yellow-500" : "text-gray-200"}`}
									>
										<option value="" className="text-gray-200">
											Select Sponsor
										</option>
										{sponsorOptions.map(sponsor => (
											<option
												key={sponsor}
												value={sponsor}
												className={
													sponsorships[player] === sponsor
														? "text-yellow-500"
														: "text-gray-200"
												}
											>
												Sponsored by: {sponsor}
											</option>
										))}
									</select>
								</div>
							))}
						</div>
					}
				</div>
			</div>

			{/* Game Settings */}
			<div className="space-y-4">
				{/* Surrender Toggle */}
				<div className="flex items-center gap-2">
					<label className="flex items-center gap-2 text-gray-200 cursor-pointer">
						<input
							type="checkbox"
							checked={isSurrendered}
							onChange={e => setIsSurrendered(e.target.checked)}
							className="form-checkbox h-4 w-4 text-purple-500 rounded border-gray-600 bg-gray-700 focus:ring-offset-0 focus:ring-1 focus:ring-purple-500 checked:bg-purple-500 checked:hover:bg-purple-600"
						/>
						<span>Surrendered Game</span>
					</label>
				</div>

				{/* Amount Selection */}
				<div className="space-y-2">
					<h3 className="text-gray-200 font-bold">Amount</h3>
					<div className="flex gap-2">
						{GAME_AMOUNTS.map(amount => (
							<button
								key={amount}
								type="button"
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
			</div>

			{/* Map Selection */}
			<div className="space-y-4">
				<div className="flex flex-col gap-4">
					<h3 className="text-white font-bold">Map Selection</h3>

					{/* Map Category Tabs */}
					<div className="flex flex-wrap gap-2">
						{(
							Object.keys(MAP_CATEGORIES) as (keyof typeof MAP_CATEGORIES)[]
						).map(category => (
							<button
								key={category}
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
						{MAP_CATEGORIES[activeMapTab].map(map => (
							<button
								type="button"
								key={`map-${map}`}
								onClick={() => {
									console.log("Setting map to:", map); // Debug log
									setSelectedMap(map);
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

			{/* Action Buttons */}
			<div className="flex justify-end gap-2">
				<button
					type="button"
					onClick={onCancel}
					className="px-3 py-1 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={!isTeamsValid()}
					className={`px-3 py-1 rounded-lg ${
						isTeamsValid()
							? "bg-purple-600 text-white hover:bg-purple-500"
							: "bg-gray-600 text-gray-400 cursor-not-allowed"
					}`}
				>
					Save
				</button>
			</div>

			{/* Add error message when teams are uneven */}
			{(winners.length > 0 || losers.length > 0) && !isTeamsValid() && (
				<div className="text-red-400 text-sm mt-2">
					Teams must have the same number of players
				</div>
			)}
		</form>
	);
}
