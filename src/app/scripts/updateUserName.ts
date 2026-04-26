import prisma from "../../lib/prisma";

async function updateUserName(
	username: string,
	oldName: string,
	newName: string,
) {
	try {
		// Update User record
		await prisma.user.updateMany({
			where: {
				username: username,
				name: oldName,
			},
			data: {
				name: newName,
			},
		});

		// Update GameDay records
		await prisma.gameDay.updateMany({
			where: {
				creatorName: oldName,
			},
			data: {
				creatorName: newName,
			},
		});

		// Update Game records
		await prisma.game.updateMany({
			where: {
				createdBy: oldName,
			},
			data: {
				createdBy: newName,
			},
		});

		console.log(
			`Successfully updated user "${username}" name from "${oldName}" to "${newName}" in all tables`,
		);
	} catch (error) {
		console.error("Error updating user name:", error);
	} finally {
		await prisma.$disconnect();
	}
}

// Get command line arguments
const username = process.argv[2];
const oldName = process.argv[3];
const newName = process.argv[4];

if (!username || !oldName || !newName) {
	console.error("Please provide username, old name, and new name as arguments");
	console.error(
		"Usage: npm run update-user-name <username> <oldName> <newName>",
	);
	process.exit(1);
}

updateUserName(username, oldName, newName);
