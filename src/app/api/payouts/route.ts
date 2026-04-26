/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			console.log("[PAYOUTS-API] Unauthorized access attempt");
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			fromUser,
			toUser,
			amount,
			gameDayId,
			isPaid,
			originalFrom,
			originalTo,
		} = body;

		// Debug log
		console.log("[PAYOUTS-API] isPaid value:", { isPaid, type: typeof isPaid });

		// Log the received data
		console.log("[PAYOUTS-API] Received payout request:", {
			fromUser,
			toUser,
			amount,
			gameDayId,
		});

		if (!fromUser || !toUser || !amount || !gameDayId) {
			console.log("[PAYOUTS-API] Missing required fields:", {
				fromUser,
				toUser,
				amount,
				gameDayId,
			});
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const gameDay = await prisma.gameDay.findUnique({
			where: { id: gameDayId },
			include: {
				games: true,
			},
		});

		if (!gameDay) {
			console.log("[PAYOUTS-API] GameDay not found:", gameDayId);
			return NextResponse.json({ error: "GameDay not found" }, { status: 404 });
		}

		const payout = await prisma.payout.create({
			data: {
				fromUser,
				toUser,
				originalFrom,
				originalTo,
				amount,
				gameDayId,
				isPaid: Boolean(isPaid),
				paidAt: isPaid ? new Date() : null,
			},
		});

		console.log("[PAYOUTS-API] Payout created successfully:", {
			id: payout.id,
		});
		return NextResponse.json(payout);
	} catch (error: any) {
		console.error("[PAYOUTS-API] Error creating payout:", {
			message: error.message,
			code: error.code,
			stack: error.stack,
		});
		return NextResponse.json(
			{ error: `Failed to create payout: ${error.message}` },
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.id) {
			console.log("[PAYOUTS-API] Unauthorized update attempt");
			return NextResponse.json(
				{
					error: "Unauthorized",
					message: "Please log in to mark payouts as paid",
				},
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { id, isPaid } = body;

		console.log("[PAYOUTS-API] Update request received:", { id, isPaid });

		const payout = await prisma.payout.update({
			where: { id },
			data: {
				isPaid,
				paidAt: isPaid ? new Date() : null,
			},
		});

		console.log("[PAYOUTS-API] Payout updated successfully:", {
			id: payout.id,
			isPaid,
		});
		return NextResponse.json(payout);
	} catch (error: any) {
		console.error("[PAYOUTS-API] Error updating payout:", {
			message: error.message,
			code: error.code,
			stack: error.stack,
		});
		return NextResponse.json(
			{ error: `Failed to update payout: ${error.message}` },
			{ status: 500 },
		);
	}
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const gameDayId = searchParams.get("gameDayId");

		if (!gameDayId) {
			return NextResponse.json(
				{ error: "Game day ID is required" },
				{ status: 400 },
			);
		}

		// Fetch games with sponsorships
		const games = await prisma.game.findMany({
			where: { gameDayId },
			orderBy: { timestamp: "desc" },
			include: {
				sponsorships: {
					include: {
						player: true,
					},
				},
			},
		});

		// Calculate net balances considering sponsorships
		const netBalances = new Map<string, { amount: number; sponsor?: string }>();

		games.forEach(game => {
			const gameAmount = game.amount || 50;
			const actualAmount =
				game.gameType === "surrendered" ? gameAmount / 2 : gameAmount;

			game.winners.forEach(winner => {
				// Find if winner has a sponsor
				const sponsorship = game.sponsorships?.find(
					s => s.player.name === winner && s.active,
				);
				const balanceHolder = sponsorship ? sponsorship.sponsorName : winner;
				const currentBalance = netBalances.get(balanceHolder)?.amount || 0;
				netBalances.set(balanceHolder, {
					amount: currentBalance + actualAmount,
					sponsor: sponsorship ? winner : undefined,
				});
			});

			game.losers.forEach(loser => {
				// Find if loser has a sponsor
				const sponsorship = game.sponsorships?.find(
					s => s.player.name === loser && s.active,
				);
				const balanceHolder = sponsorship ? sponsorship.sponsorName : loser;
				const currentBalance = netBalances.get(balanceHolder)?.amount || 0;
				netBalances.set(balanceHolder, {
					amount: currentBalance - actualAmount,
					sponsor: sponsorship ? loser : undefined,
				});
			});
		});

		const payouts: Array<{
			payFrom: string;
			payFromId: string;
			payTo: string;
			payToId: string;
			amount: number;
			originalFrom?: string;
			originalTo?: string;
			isPaid: boolean;
		}> = [];

		// Sort by balance
		const debtors = Array.from(netBalances.entries())
			.filter(([_, { amount }]) => amount < 0)
			.sort((a, b) => a[1].amount - b[1].amount);

		const creditors = Array.from(netBalances.entries())
			.filter(([_, { amount }]) => amount > 0)
			.sort((a, b) => b[1].amount - a[1].amount);

		let debtorIdx = 0;
		let creditorIdx = 0;

		// Fetch all players involved in the calculations
		const players = await prisma.player.findMany({
			where: {
				name: {
					in: [
						...debtors.map(([name]) => name),
						...creditors.map(([name]) => name),
					],
				},
			},
		});

		// Create a map of player names to their full records
		const playerMap = new Map(players.map(player => [player.name, player]));

		// Special handling for 无求 and 蛋蛋
		const wuqiuIndex = debtors.findIndex(([name]) => name === "无求");
		const dandanIndex = creditors.findIndex(([name]) => name === "蛋蛋");

		if (wuqiuIndex !== -1 && dandanIndex !== -1) {
			const [wuqiuName, { amount: wuqiuBalance, sponsor: wuqiuSponsor }] =
				debtors[wuqiuIndex];
			const [dandanName, { amount: dandanBalance, sponsor: dandanSponsor }] =
				creditors[dandanIndex];

			const amount = Math.min(Math.abs(wuqiuBalance), dandanBalance);

			if (amount > 0) {
				const fromPlayer = playerMap.get(wuqiuName);
				const toPlayer = playerMap.get(dandanName);

				const existingPayout = await prisma.payout.findFirst({
					where: {
						gameDayId,
						fromUser: wuqiuName,
						toUser: dandanName,
						amount: Math.round(amount),
					},
				});

				payouts.push({
					payFrom: fromPlayer?.name || wuqiuName,
					payFromId: wuqiuName,
					payTo: toPlayer?.name || dandanName,
					payToId: dandanName,
					amount: Math.round(amount),
					originalFrom: wuqiuSponsor,
					originalTo: dandanSponsor,
					isPaid: existingPayout?.isPaid || false,
				});

				// Update balances
				if (Math.abs(wuqiuBalance) === amount) {
					debtors.splice(wuqiuIndex, 1);
				} else {
					debtors[wuqiuIndex][1].amount += amount;
				}

				if (dandanBalance === amount) {
					creditors.splice(dandanIndex, 1);
				} else {
					creditors[dandanIndex][1].amount -= amount;
				}
			}
		}

		// Process remaining payments
		while (debtorIdx < debtors.length && creditorIdx < creditors.length) {
			const [debtorName, { amount: debtorBalance, sponsor: debtorSponsor }] =
				debtors[debtorIdx];
			const [
				creditorName,
				{ amount: creditorBalance, sponsor: creditorSponsor },
			] = creditors[creditorIdx];

			// Skip if this would create a payment from 无求 to someone other than 蛋蛋
			if (debtorName === "无求" && creditorName !== "蛋蛋") {
				debtorIdx++;
				continue;
			}

			const amount = Math.min(Math.abs(debtorBalance), creditorBalance);

			if (amount > 0) {
				const fromPlayer = playerMap.get(debtorName);
				const toPlayer = playerMap.get(creditorName);

				const existingPayout = await prisma.payout.findFirst({
					where: {
						gameDayId,
						fromUser: debtorName,
						toUser: creditorName,
						amount: Math.round(amount),
					},
				});

				payouts.push({
					payFrom: fromPlayer?.name || debtorName,
					payFromId: debtorName,
					payTo: toPlayer?.name || creditorName,
					payToId: creditorName,
					amount: Math.round(amount),
					originalFrom: debtorSponsor,
					originalTo: creditorSponsor,
					isPaid: existingPayout?.isPaid || false,
				});
			}

			if (Math.abs(debtorBalance) === amount) {
				debtorIdx++;
			} else {
				debtors[debtorIdx][1].amount += amount;
			}

			if (creditorBalance === amount) {
				creditorIdx++;
			} else {
				creditors[creditorIdx][1].amount -= amount;
			}
		}

		return NextResponse.json(payouts);
	} catch (error) {
		console.error("Error calculating payouts:", error);
		return NextResponse.json(
			{ error: "Failed to calculate payouts" },
			{ status: 500 },
		);
	}
}
