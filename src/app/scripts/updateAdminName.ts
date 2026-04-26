import prisma from "../../lib/prisma";

async function updateAdminName() {
	try {
		await prisma.user.updateMany({
			where: {
				username: "admin",
				name: "管理",
			},
			data: {
				name: "dan",
			},
		});

		// Update GameDay records
		await prisma.gameDay.updateMany({
			where: {
				creatorName: "管理",
			},
			data: {
				creatorName: "dan",
			},
		});

		// Update Game records
		await prisma.game.updateMany({
			where: {
				createdBy: "管理",
			},
			data: {
				createdBy: "dan",
			},
		});

		console.log("Successfully updated admin name in all tables");
	} catch (error) {
		console.error("Error updating admin name:", error);
	} finally {
		await prisma.$disconnect();
	}
}

updateAdminName();
