import { PlayerWithBalance } from "@/app/types";

export async function calculatePlayerBalances(
	games: any[],
): Promise<Record<string, PlayerWithBalance>> {
	const playerBalances = games.reduce((acc, game) => {
		const gameAmount = game.amount || 50;
		const actualAmount =
			game.gameType === "surrendered" ? gameAmount / 2 : gameAmount;

		game.winners.forEach((winner: string) => {
			if (!acc[winner]) {
				acc[winner] = {
					name: winner,
					balance: 0,
					gamesWon: 0,
					gamesLost: 0,
					gamesWonAmounts: [],
					gamesLostAmounts: [],
				};
			}
			acc[winner].balance += actualAmount;
			acc[winner].gamesWon += 1;
			acc[winner].gamesWonAmounts.push(actualAmount);
		});

		game.losers.forEach((loser: string) => {
			if (!acc[loser]) {
				acc[loser] = {
					name: loser,
					balance: 0,
					gamesWon: 0,
					gamesLost: 0,
					gamesWonAmounts: [],
					gamesLostAmounts: [],
				};
			}
			acc[loser].balance -= actualAmount;
			acc[loser].gamesLost += 1;
			acc[loser].gamesLostAmounts.push(actualAmount);
		});

		return acc;
	}, {} as Record<string, PlayerWithBalance>);

	return playerBalances;
}
