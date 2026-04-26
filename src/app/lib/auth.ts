import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
	providers: [
		CredentialsProvider({
			credentials: {
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.username || !credentials?.password) {
					return null;
				}

				const user = await prisma.user.findUnique({
					where: { username: credentials.username },
				});

				if (
					!user ||
					!(await bcrypt.compare(credentials.password, user.password))
				) {
					return null;
				}

				return {
					id: user.id,
					username: user.username,
					name: user.name,
				};
			},
		}),
	],
	callbacks: {
		jwt: async ({ token, user }) => {
			if (user) {
				return {
					...token,
					id: user.id,
					username: user.username,
					name: user.name,
				};
			}
			return token;
		},
		session: async ({ session, token }) => ({
			...session,
			user: {
				id: token.id,
				name: token.name,
				username: token.username,
			},
		}),
	},
};
