const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ALL_PLAYERS = [
	"把妹王",
	"无言",
	"痞老板",
	"安排",
	"下",
	"顾梦",
	"勋",
	"啊馋",
	"小奶",
	"蛋蛋",
	"poopie",
	"清明",
	"小亦",
	"吃鸡大王",
	"biubiu",
	"极",
	"星河",
	"老八",
	"yk",
	"成熟",
	"岁岁",
	"果果",
	"灿灿",
	"柠檬",
	"龟龟",
	"增国",
	"和诺",
	"孤单",
	"传奇",
	"遗忘",
	"zhuzhu",
	"龙🐟",
	"临仔",
	"三叶",
	"stepDidi",
	"李京泽",
	"Seven",
	"Mega",
	"Wuxin",
	"卧龙",
	"DD",
	"小骚当",
	"吴亦鸣",
	"蛋糕",
];

async function main() {
	for (const playerName of ALL_PLAYERS) {
		await prisma.player.upsert({
			where: { name: playerName },
			update: {},
			create: { name: playerName },
		});
	}
}

main()
	.catch(e => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
