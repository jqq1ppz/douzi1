import { GameType } from "@prisma/client";

export enum GameDayStatus {
	NOT_STARTED = "NOT_STARTED",
	IN_PROGRESS = "IN_PROGRESS",
	COMPLETED = "COMPLETED",
}

export type GameDay = {
	id: string;
	date: Date;
	games: Game[];
	creatorId: string;
	creatorName: string;
	biggestWinner?: string;
	biggestLoser?: string;
	biggestWinnerAmount?: number;
	biggestLoserAmount?: number;
	playerDailyBalance?: number;
	status: GameDayStatus;
	totalWon: number;
};

export type Game = {
	id: string;
	winners: string[];
	losers: string[];
	gameType: GameType;
	createdBy: string;
	createdById: string | null;
	timestamp: Date;
	createdAt: Date;
	updatedAt: Date;
	map: string | null;
	status?: string;
	sponsorships: GameSponsorship[];
	amount: number;
};

export type Player = {
	id: string;
	name: string;
	createdAt: Date;
	updatedAt: Date;
};

export interface PlayerWithBalance {
	name: string;
	balance: number;
	gamesWon?: number;
	gamesLost?: number;
	gamesWonAmounts?: number[];
	gamesLostAmounts?: number[];
}

export interface Season {
	id: number;
	name: string;
	startDate: Date;
	endDate: Date | null; // null = ongoing
}

export const SEASONS: Season[] = [
	{
		id: 0,
		name: "All Seasons",
		startDate: new Date("2025-01-07"),
		endDate: null,
	},
	{
		id: 1,
		name: "Season 1",
		startDate: new Date("2025-01-07"),
		endDate: new Date("2025-02-23"),
	},
	{
		id: 2,
		name: "Season 2",
		startDate: new Date("2025-02-24"),
		endDate: new Date("2025-04-23"),
	},
	{
		id: 3,
		name: "Season 3",
		startDate: new Date("2025-04-23"),
		endDate: new Date("2025-06-08T22:20:00-04:00"),
	},
	{
		id: 4,
		name: "Season 4",
		startDate: new Date("2025-06-08T22:20:00-04:00"),
		endDate: null,
	},
];

export interface GameSponsorship {
	id: string;
	playerId: string;
	sponsorName: string;
	percentage: number;
	gameId?: string | null;
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
	duration: "LONG_TERM" | "TODAY_ONLY";
	gameDayId?: string | null;
	player?: {
		name: string;
	};
}
