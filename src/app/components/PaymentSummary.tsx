import { Game, GameDay, PlayerWithBalance } from "@/app/types";
import React, { useState, useEffect } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import type { GameSponsorship, Player } from "@prisma/client";
import LoadingSpinner2 from "./LoadingSpinner2";

interface Props {
	players: PlayerWithBalance[];
	gameDay: GameDay;
	refreshTrigger?: number;
}

interface Payout {
	payFrom: string;
	payFromId: string;
	payTo: string;
	payToId: string;
	amount: number;
	isPaid: boolean;
	originalPayFrom?: string;
	originalPayTo?: string;
}

interface PayoutResponse {
	id: string;
	fromUser: string;
	toUser: string;
	amount: number;
	isPaid: boolean;
}

interface SponsorPaymentGroup {
	sponsorName: string;
	gameRange: string;
	payments: Record<string, number>;
	total: number;
}

export default function PaymentSummary({
	players,
	gameDay,
	refreshTrigger,
}: Props) {
	const router = useRouter();
	const [copied, setCopied] = React.useState(false);
	const [paidStatus, setPaidStatus] = useState<Record<string, boolean>>({});
	const [payoutIds, setPayoutIds] = useState<Record<string, string>>({});
	const [showLoginModal, setShowLoginModal] = useState(false);
	const [sponsorships, setSponsorships] = useState<GameSponsorship[]>([]);
	const [finalPayments, setFinalPayments] = useState<Map<string, number>>(
		new Map(),
	);
	const [sponsorGroups, setSponsorGroups] = useState<SponsorPaymentGroup[]>([]);
	const [playerSponsors, setPlayerSponsors] = useState<Record<string, string>>(
		{},
	);
	const [allPlayers, setAllPlayers] = useState<Player[]>([]);
	const [payouts, setPayouts] = useState<
		Array<{
			payFrom: string;
			payFromId: string;
			payTo: string;
			payToId: string;
			amount: number;
			isPaid: boolean;
			originalPayFrom: string;
			originalPayTo: string;
		}>
	>([]);
	const [playerBalances, setPlayerBalances] = useState<
		Array<{
			name: string;
			balance: number;
			gamesWon: number;
			gamesLost: number;
			totalWinAmount: number;
			totalLoseAmount: number;
		}>
	>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchPayouts = async () => {
		if (gameDay?.id) {
			setIsLoading(true);
			try {
				const response = await fetch(`/api/payouts?gameDayId=${gameDay.id}`);
				const data = await response.json();
				console.log("Fetched payouts:", data); // Debug log

				// Directly use the data from API without modification
				setPayouts(
					data.map((payout: any) => ({
						payFrom: payout.payFrom,
						payFromId: payout.payFromId,
						payTo: payout.payTo,
						payToId: payout.payToId,
						amount: payout.amount,
						isPaid: payout.isPaid,
						originalPayFrom: payout.originalFrom,
						originalPayTo: payout.originalTo,
					})),
				);
			} catch (error) {
				console.error("Failed to fetch payouts:", error);
			} finally {
				setIsLoading(false);
			}
		}
	};

	useEffect(() => {
		fetchPayouts();
	}, [gameDay?.id, players]);

	useEffect(() => {
		const fetchPlayerBalances = async () => {
			if (gameDay?.id) {
				try {
					const response = await fetch(
						`/api/games/${gameDay.id}/playerBalances`,
					);
					const data = await response.json();
					if (Array.isArray(data)) {
						setPlayerBalances(data);
					}
				} catch (error) {
					console.error("Failed to fetch player balances:", error);
				}
			}
		};

		fetchPlayerBalances();
	}, [gameDay?.id]);

	const getShareableText = () => {
		if (payouts.length === 0) return "No payments needed";

		// Add date header
		const date = gameDay?.date
			? new Date(gameDay.date).toLocaleDateString("en-US", {
					month: "numeric",
					day: "numeric",
					year: "numeric",
			  })
			: "Date not set";

		return `${date}\n${payouts
			.map(payout => {
				let text = "";
				// Add original players if different from final payers
				if (
					payout.originalPayFrom &&
					payout.originalPayFrom !== payout.payFrom
				) {
					text += `${payout.originalPayFrom}(${payout.payFrom})`;
				} else {
					text += payout.payFrom;
				}
				text += " → ";
				if (payout.originalPayTo && payout.originalPayTo !== payout.payTo) {
					text += `${payout.originalPayTo}(${payout.payTo})`;
				} else {
					text += payout.payTo;
				}
				text += `: ¥${payout.amount}`;
				if (payout.isPaid) {
					text += " ✓";
				}
				return text;
			})
			.join("\n")}`;
	};

	const handleCopy = async () => {
		await navigator.clipboard.writeText(getShareableText());
		setCopied(true);
		setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
	};

	const handleMarkAsPaid = async (payout: {
		payFrom: string;
		payFromId: string;
		payTo: string;
		payToId: string;
		amount: number;
	}) => {
		try {
			const payoutKey = `${payout.payFrom}-${payout.payTo}`;
			let payoutId = payoutIds[payoutKey];

			if (!payoutId) {
				// Create new payout if it doesn't exist
				const createResponse = await fetch("/api/payouts", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						fromUser: payout.payFrom,
						toUser: payout.payTo,
						amount: payout.amount,
						gameDayId: gameDay.id,
						isPaid: true,
					}),
				});

				if (!createResponse.ok) {
					if (createResponse.status === 401) {
						setShowLoginModal(true);
						return;
					}
					throw new Error("Failed to create payout");
				}

				const newPayout = await createResponse.json();
				payoutId = newPayout.id;

				// Update local state with new payout ID
				setPayoutIds(prev => ({
					...prev,
					[payoutKey]: payoutId,
				}));
			} else {
				// Update existing payout
				const response = await fetch("/api/payouts", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: payoutId,
						isPaid: true,
					}),
				});

				if (!response.ok) {
					if (response.status === 401) {
						setShowLoginModal(true);
						return;
					}
					throw new Error("Failed to mark payout as paid");
				}
			}

			// Update the payouts state directly
			setPayouts(prevPayouts =>
				prevPayouts.map(p =>
					p.payFrom === payout.payFrom && p.payTo === payout.payTo
						? { ...p, isPaid: true }
						: p,
				),
			);

			setPaidStatus(prev => ({
				...prev,
				[payoutKey]: true,
			}));
		} catch (error) {
			console.error("Failed to mark payout as paid:", error);
		}
	};

	// Load initial paid status when component mounts
	useEffect(() => {
		const loadPaidStatus = async () => {
			try {
				const response = await fetch(`/api/payouts?gameDayId=${gameDay.id}`);
				const payouts = await response.json();

				const newPaidStatus: Record<string, boolean> = {};
				payouts.forEach((payout: PayoutResponse) => {
					newPaidStatus[`${payout.fromUser}-${payout.toUser}`] = payout.isPaid;
				});

				setPaidStatus(newPaidStatus);
			} catch (error) {
				console.error("Failed to load paid status:", error);
			}
		};

		if (gameDay?.id) {
			loadPaidStatus();
		}
	}, [gameDay?.id]);

	useEffect(() => {
		const fetchSponsorships = async () => {
			try {
				const response = await fetch("/api/sponsorships");
				const data = await response.json();
				console.log("API Response data:", data);

				// Filter active sponsorships and use player names
				const activeSponsors: Record<string, string> = {};
				data.forEach((sponsorship: any) => {
					// Check if sponsorship is active for this game day
					const isActive =
						sponsorship.active &&
						(sponsorship.duration === "LONG_TERM" ||
							sponsorship.gameDayId === gameDay.id);

					console.log("Checking sponsorship:", {
						sponsorship,
						isActive,
						playerMatch: players.find(p => p.name === sponsorship.playerId)
							?.name,
					});

					if (isActive) {
						activeSponsors[sponsorship.playerId] = sponsorship.sponsorName;
					}
				});

				console.log("Setting active sponsors:", activeSponsors);
				setPlayerSponsors(activeSponsors);
				setSponsorships(data);
			} catch (error) {
				console.error("Failed to fetch sponsorships:", error);
			}
		};

		if (gameDay?.id) {
			fetchSponsorships();
		}
	}, [gameDay?.id, players]);

	useEffect(() => {
		// Calculate payments including sponsorships
		const payments = new Map<string, number>();

		// initial balances
		players.forEach(player => {
			payments.set(player.name, player.balance);
		});

		// Then adjust for sponsorships
		sponsorships.forEach(sponsorship => {
			const playerBalance = payments.get(sponsorship.playerId) || 0;
			const sponsorShare = (playerBalance * sponsorship.percentage) / 100;

			// Adjust player's balance
			payments.set(sponsorship.playerId, playerBalance - sponsorShare);

			// Add sponsor's share
			payments.set(
				sponsorship.sponsorName,
				(payments.get(sponsorship.sponsorName) || 0) + sponsorShare,
			);
		});

		setFinalPayments(payments);
	}, [players, sponsorships]);

	useEffect(() => {
		const groups: SponsorPaymentGroup[] = [];
		let currentGroup: SponsorPaymentGroup | null = null;

		gameDay.games?.forEach((game, index) => {
			game.sponsorships?.forEach(sponsorship => {
				const playerAmount = game.gameType === "full" ? 50 : 25;
				const sponsorAmount = (playerAmount * sponsorship.percentage) / 100;
				const amount = game.winners.includes(sponsorship.playerId)
					? sponsorAmount
					: -sponsorAmount;

				// Check if we need to start a new group
				if (
					!currentGroup ||
					currentGroup.sponsorName !== sponsorship.sponsorName
				) {
					if (currentGroup) {
						groups.push(currentGroup);
					}
					currentGroup = {
						sponsorName: sponsorship.sponsorName,
						gameRange: `Game ${index + 1}`,
						payments: {},
						total: 0,
					};
				} else {
					// Update game range end
					currentGroup.gameRange = `Games ${
						currentGroup.gameRange.split(" ")[1]
					}-${index + 1}`;
				}

				// Add payment to current group
				currentGroup.payments[sponsorship.playerId] =
					(currentGroup.payments[sponsorship.playerId] || 0) + amount;
				currentGroup.total += amount;
			});
		});

		if (currentGroup) {
			groups.push(currentGroup);
		}

		setSponsorGroups(groups);
	}, [gameDay.games]);

	// Group payouts by sponsor
	const groupedPayouts = payouts.reduce(
		(acc: Record<string, Payout[]>, payout) => {
			// Find if this payment involves a sponsor
			const sponsorship = sponsorships.find(
				s =>
					(s.playerId === payout.payFrom || s.playerId === payout.payTo) &&
					s.active &&
					s.gameDayId === gameDay.id,
			);
			// console.log("Found sponsorship:", sponsorship, "for payout:", payout);

			const key = sponsorship ? sponsorship.sponsorName : "";
			if (!acc[key]) {
				acc[key] = [];
			}
			acc[key].push(payout);
			return acc;
		},
		{},
	);
	// console.log("Grouped payouts:", groupedPayouts);

	const getTextColor = (name: string, isReceiving: boolean) => {
		if (isSponsor(name)) return "text-yellow-400"; // Gold color for sponsors
		return isReceiving ? "text-green-400" : "text-red-400"; // Green for receivers, red for payers
	};

	// Helper function to check if a name is a sponsor
	const isSponsor = (name: string) => {
		const sponsorship = sponsorships.find(
			s => s.sponsorName === name && s.active && s.gameDayId === gameDay.id,
		);
		return !!sponsorship;
	};

	return (
		<div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-purple-500/20 shadow-lg">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
					Payment Summary
				</h2>
				<button
					onClick={handleCopy}
					className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-all duration-300"
				>
					{copied ? (
						<>
							<FiCheck className="w-4 h-4 text-green-400" />
							<span className="text-green-400 text-sm">Copied!</span>
						</>
					) : (
						<>
							<FiCopy className="w-4 h-4 text-gray-300" />
							<span className="text-gray-300 text-sm">Copy</span>
						</>
					)}
				</button>
			</div>
			<div className="mt-6 space-y-4">
				{payouts.map((payout, index) => (
					<div
						key={index}
						className="p-4 rounded-lg bg-gray-800/30 border border-purple-500/10 backdrop-blur-sm hover:border-purple-500/30 transition-all duration-300"
					>
						<div className="flex justify-between items-start sm:items-center gap-4">
							<div className="flex items-center gap-2">
								<div className="flex items-center gap-2">
									{payout.originalPayFrom &&
										payout.originalPayFrom !== payout.payFrom && (
											<>
												<span className="text-red-400 line-through">
													{payout.originalPayFrom}
												</span>
												<span className="text-gray-500">/</span>
											</>
										)}
									<span
										className={`font-medium ${getTextColor(
											payout.payFrom,
											false,
										)}`}
									>
										{payout.payFrom}
									</span>
									<span className="text-purple-400">→</span>
									{payout.originalPayTo &&
										payout.originalPayTo !== payout.payTo && (
											<>
												<span className="text-green-400 line-through">
													{payout.originalPayTo}
												</span>
												<span className="text-gray-500">/</span>
											</>
										)}
									<span
										className={`font-medium ${getTextColor(
											payout.payTo,
											true,
										)}`}
									>
										{payout.payTo}
									</span>
								</div>
							</div>

							<div className="flex items-center gap-4">
								<div className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
									¥{payout.amount}
								</div>
								{gameDay?.status === "COMPLETED" && (
									<div className="min-w-[80px]">
										{payout.isPaid ? (
											<div className="flex items-center justify-center gap-2 p-2 bg-gray-800/50 rounded-lg">
												<FiCheck className="w-4 h-4 text-green-400" />
												<span className="text-green-400 font-medium">Paid</span>
											</div>
										) : (
											<button
												onClick={() => handleMarkAsPaid(payout)}
												className="w-full p-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg text-sm font-medium transition-all duration-300"
											>
												Confirm
											</button>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
