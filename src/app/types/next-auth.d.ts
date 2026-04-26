import type { DefaultSession } from "next-auth";

declare module "next-auth" {
	interface User {
		username: string;
		id: string;
	}

	interface Session {
		user: {
			id: string;
			username: string;
			name?: string | null;
		} & DefaultSession["user"];
	}
}
