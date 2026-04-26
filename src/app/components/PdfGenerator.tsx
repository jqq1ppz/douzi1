import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import { TDocumentDefinitions } from "pdfmake/interfaces";
import { PlayerWithBalance } from "../types";

interface Props {
	players: PlayerWithBalance[];
}

interface Payout {
	from: string;
	to: string;
	amount: number;
}

const pinyinMap: { [key: string]: string } = {
	把妹王: "Ba Mei Wang",
	无言: "Wu Yan",
	痞老板: "Pi Lao Ban",
	安排: "An Pai",
	下: "Xia",
	顾梦: "Gu Meng",
	勋: "Xun",
	啊馋: "A Chan",
	小奶: "Xiao Nai",
	蛋蛋: "Dan Dan",
	清明: "Qing Ming",
	小亦: "Xiao Yi",
	吃鸡大王: "Chi Ji Da Wang",
	极: "Ji",
	星河: "Xing He",
	老八: "Lao Ba",
	成熟: "Cheng Shu",
	岁岁: "Sui Sui",
	果果: "Guo Guo",
	灿灿: "Can Can",
	柠檬: "Ning Meng",
	龟龟: "Gui Gui",
	增国: "Zeng Guo",
	和诺: "He Nuo",
	娜娜: "Na Na",
	传奇: "Chuan Qi",
	遗忘: "Yi Wang",
	"龙🐟": "Long Yu",
	临仔: "Lin Zai",
	三叶: "San Ye",
	李京泽: "Li Jing Ze",
};

const toPinyin = (name: string) => pinyinMap[name] || name;

const calculatePayouts = (players: PlayerWithBalance[]): Payout[] => {
	const workingPlayers = players.map(p => ({ ...p }));
	const debtors = workingPlayers
		.filter(p => p.balance < 0)
		.sort((a, b) => a.balance - b.balance);
	const creditors = workingPlayers
		.filter(p => p.balance > 0)
		.sort((a, b) => b.balance - a.balance);

	const payouts = [];

	while (debtors.length > 0 && creditors.length > 0) {
		const debtor = debtors[0];
		const creditor = creditors[0];
		const transferAmount = Math.min(Math.abs(debtor.balance), creditor.balance);

		if (transferAmount > 0) {
			payouts.push({
				from: debtor.name,
				to: creditor.name,
				amount: Math.round(transferAmount),
			});

			debtor.balance += transferAmount;
			creditor.balance -= transferAmount;
		}

		if (Math.abs(debtor.balance) < 1) debtors.shift();
		if (Math.abs(creditor.balance) < 1) creditors.shift();
	}

	return payouts;
};

export let vfs: { [file: string]: string };
export default function PdfGenerator({ players }: Props) {
	const generatePDF = () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(pdfMake as any).vfs = pdfFonts;

		const date = new Date().toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});

		const payouts = calculatePayouts(players);

		const docDefinition: TDocumentDefinitions = {
			defaultStyle: {
				font: "Roboto",
			},
			content: [
				{
					text: "Game Day Summary",
					style: "header",
					alignment: "center",
					margin: [0, 0, 0, 20],
				},

				{ text: "Player Statistics", style: "subheader" },
				{
					table: {
						headerRows: 1,
						widths: ["*", "auto", "auto", "auto"],
						body: [
							[
								{ text: "Player", style: "tableHeader" },
								{ text: "Games Won", style: "tableHeader" },
								{ text: "Games Lost", style: "tableHeader" },
								{ text: "Balance", style: "tableHeader" },
							],
							...players.map(player => [
								toPinyin(player.name),
								{ text: player.gamesWon, alignment: "center" },
								{ text: player.gamesLost, alignment: "center" },
								{
									text: player.balance,
									alignment: "center",
									color:
										player.balance > 0
											? "#22c55e"
											: player.balance < 0
											? "#ef4444"
											: "#000000",
								},
							]),
						],
					},
					layout: {
						fillColor: function (rowIndex: number) {
							return rowIndex === 0 ? "#f3f4f6" : null;
						},
					},
				},

				{ text: "Payment Summary", style: "subheader", margin: [0, 30, 0, 10] },
				payouts.length > 0
					? {
							table: {
								headerRows: 1,
								widths: ["*", "*", "auto"],
								body: [
									[
										{ text: "From", style: "tableHeader" },
										{ text: "To", style: "tableHeader" },
										{ text: "Amount (¥)", style: "tableHeader" },
									],
									...payouts.map(payout => [
										{ text: toPinyin(payout.from), color: "#ef4444" },
										{ text: toPinyin(payout.to), color: "#22c55e" },
										{
											text: payout.amount,
											alignment: "center",
											bold: true,
										},
									]),
								],
							},
							layout: {
								fillColor: function (rowIndex: number) {
									return rowIndex === 0
										? "#f3f4f6"
										: rowIndex % 2 === 0
										? "#ffffff"
										: "#f9fafb";
								},
								hLineWidth: () => 1,
								vLineWidth: () => 0,
								hLineColor: () => "#e5e7eb",
							},
					  }
					: {
							text: "No payments needed",
							style: "noPayments",
					  },
			],
			styles: {
				header: {
					fontSize: 24,
					bold: true,
					color: "#1f2937",
				},
				subheader: {
					fontSize: 18,
					bold: true,
					margin: [0, 20, 0, 10],
					color: "#374151",
				},
				tableHeader: {
					bold: true,
					fontSize: 12,
					color: "#374151",
					fillColor: "#f3f4f6",
					alignment: "center",
				},
				noPayments: {
					fontSize: 12,
					color: "#6b7280",
					italics: true,
					alignment: "center",
				},
			},
		};

		pdfMake.createPdf(docDefinition).download(`game-day-summary-${date}.pdf`);
	};

	return (
		<button
			onClick={generatePDF}
			className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded shadow text-sm md:text-base md:px-4 md:py-2 whitespace-nowrap flex items-center gap-2"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				className="h-4 w-4 md:h-5 md:w-5"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fillRule="evenodd"
					d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
					clipRule="evenodd"
				/>
			</svg>
			PDF
		</button>
	);
}
