import Link from "next/link";
import { GameDay, Season } from "../types";
import { GiTrophyCup } from "react-icons/gi";
import { FaSkullCrossbones } from "react-icons/fa6";
import { useEffect, useState } from "react";

interface Props {
	player: string;
	gameDays: GameDay[];
	className?: string;
	selectedSeason: Season;
}

interface PlayerBalance {
	name: string;
	balance: number;
	gamesWon: number;
	gamesLost: number;
}

export default function PlayerHistory({
	player,
	gameDays,
	className,
	selectedSeason,
}: Props) {
	const excludedDates = ["2025-01-31", "2025-01-28"];
	const [playerBalances, setPlayerBalances] = useState<
		Record<string, PlayerBalance>
	>({});
	const [loadingBalances, setLoadingBalances] = useState<
		Record<string, boolean>
	>({});

	useEffect(() => {
		const fetchBalances = async () => {
			const balances: Record<string, PlayerBalance> = {};
			const loading: Record<string, boolean> = {};

			for (const gameDay of gameDays) {
				const gameDate = new Date(gameDay.date);
				const isInSeason =
					gameDate >= selectedSeason.startDate &&
					(!selectedSeason.endDate || gameDate <= selectedSeason.endDate);

				if (!isInSeason) continue;

				if (
					selectedSeason.id === 1 &&
					player === "Poopie" &&
					excludedDates.includes(gameDate.toISOString().split("T")[0])
				) {
					continue;
				}

				loading[gameDay.id] = true;
				setLoadingBalances(prev => ({ ...prev, [gameDay.id]: true }));

				try {
					const response = await fetch(
						`/api/games/${gameDay.id}/playerBalances`,
					);
					const data = await response.json();
					if (Array.isArray(data)) {
						const playerBalance = data.find(
							(p: PlayerBalance) => p.name === player,
						);
						if (playerBalance) {
							balances[gameDay.id] = playerBalance;
						}
					}
				} catch (error) {
					console.error("Failed to fetch player balances:", error);
				} finally {
					loading[gameDay.id] = false;
					setLoadingBalances(prev => ({ ...prev, [gameDay.id]: false }));
				}
			}

			setPlayerBalances(balances);
		};

		fetchBalances();
	}, [gameDays, player, selectedSeason]);

	const playedDays = gameDays.filter(gameDay => {
		const gameDate = new Date(gameDay.date);
		const isInSeason =
			gameDate >= selectedSeason.startDate &&
			(!selectedSeason.endDate || gameDate <= selectedSeason.endDate);

		if (!isInSeason) return false;

		if (
			selectedSeason.id === 1 &&
			player === "Poopie" &&
			excludedDates.includes(gameDate.toISOString().split("T")[0])
		) {
			return false;
		}

		return gameDay.games.some(
			game => game.winners.includes(player) || game.losers.includes(player),
		);
	});

	return (
		<div className={`${className || ""}`}>
			<h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
				Game History
			</h2>
			{playedDays.length === 0 ? (
				<p className="text-gray-500 dark:text-gray-400 italic">
					This player hasn&apos;t played any games yet.
				</p>
			) : (
				<div className="space-y-3">
					{playedDays.map(day => (
						<Link
							href={`/game/${day.id}`}
							key={day.id}
							className="block p-4 border border-purple-500/20 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-200 hover:border-purple-500/30"
						>
							<div className="flex justify-between items-center">
								<div className="flex gap-4">
									<span className="text-gray-200">
										{new Date(day.date).toLocaleDateString()}
									</span>
									<div className="flex items-center gap-3 text-sm">
										<div className="flex items-center gap-1">
											<GiTrophyCup className="w-4 h-4 text-yellow-400" />
											<span className="text-gray-400">
												{
													day.games.filter(g => g.winners.includes(player))
														.length
												}
											</span>
										</div>
										<div className="flex items-center gap-1">
											<FaSkullCrossbones className="w-4 h-4 text-red-400" />
											<span className="text-gray-400">
												{
													day.games.filter(g => g.losers.includes(player))
														.length
												}
											</span>
										</div>
									</div>
								</div>
								{!playerBalances[day.id]?.balance ? (
									<div className="w-16 h-6 flex items-center justify-center">
										<div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
									</div>
								) : (
									<span
										className={
											(playerBalances[day.id]?.balance || 0) > 0
												? "text-green-400 font-bold"
												: (playerBalances[day.id]?.balance || 0) < 0
												? "text-red-400 font-bold"
												: "text-gray-400 font-bold"
										}
									>
										{playerBalances[day.id]?.balance > 0 ? "+" : ""}
										{playerBalances[day.id]?.balance || 0}
									</span>
								)}
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
