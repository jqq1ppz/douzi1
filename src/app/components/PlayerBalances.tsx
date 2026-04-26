"use client";
import React, {
	useState,
	useEffect,
	useImperativeHandle,
	forwardRef,
} from "react";
import Link from "next/link";
import { customToast } from "../utils/toast";

interface PlayerStats {
	name: string;
	balance: number;
	gamesWon: number;
	gamesLost: number;
	totalWinAmount: number;
	totalLoseAmount: number;
}

interface Props {
	gameDayId: string;
	refreshTrigger?: number;
}

export const PlayerBalances = forwardRef<
	{ refresh: () => Promise<void> },
	Props
>(({ gameDayId, refreshTrigger }, ref) => {
	const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [balances, setBalances] = useState([]);

	const fetchBalances = async () => {
		try {
			const response = await fetch(`/api/games/${gameDayId}/playerBalances`);
			const data = await response.json();
			setBalances(data);
			if (Array.isArray(data)) {
				setPlayerStats(data);
			}
		} catch (error) {
			console.error("Failed to fetch player balances:", error);
			customToast.error("Failed to load player balances");
		} finally {
			setIsLoading(false);
		}
	};

	// Expose the refresh function to parent
	useImperativeHandle(ref, () => ({
		refresh: fetchBalances,
	}));

	useEffect(() => {
		fetchBalances();
	}, [gameDayId, refreshTrigger]);

	if (isLoading) {
		return <div>Loading balances...</div>;
	}

	return (
		<div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 shadow-lg">
			<h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
				Player Balances
			</h2>
			<div className="mt-6 space-y-4">
				{playerStats.map((player, index) => (
					<div key={player.name} className="relative overflow-hidden group">
						<div className="p-4 rounded-lg bg-gray-800/30 border border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300">
							<div className="flex justify-between items-center">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
										{index + 1}
									</div>
									<Link
										href={`/players?name=${encodeURIComponent(player.name)}`}
										className="font-medium text-gray-200 hover:underline"
									>
										{player.name}
									</Link>
								</div>

								<div className="flex items-center gap-4">
									<div className="flex flex-col items-end">
										<div className="flex items-baseline gap-2">
											<span className="text-green-400 font-bold">
												{player.gamesWon}
											</span>
											<span className="text-gray-600">/</span>
											<span className="text-red-400 font-bold">
												{player.gamesLost}
											</span>
										</div>
										<div className="text-xs text-gray-500">Won/Lost</div>
									</div>

									<div
										className={`font-bold text-xl ${
											player.balance > 0
												? "text-green-400"
												: player.balance < 0
												? "text-red-400"
												: "text-gray-400"
										}`}
									>
										{player.balance > 0 && "+"}¥{player.balance}
									</div>
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
});
