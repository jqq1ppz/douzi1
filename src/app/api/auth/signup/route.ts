import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
	return NextResponse.json(
		{
			error: "Method not allowed. Use POST to create a user.",
		},
		{ status: 405 },
	);
}

export async function POST(request: NextRequest) {
	try {
		const { username, password: psw, name } = await request.json();

		// Validate input
		if (!username || !psw || !name) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Check if user already exists
		const existingUser = await prisma.user.findUnique({
			where: { username },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Username already exists" },
				{ status: 400 },
			);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(psw, 10);

		// Create user
		const user = await prisma.user.create({
			data: {
				username,
				password: hashedPassword,
				name,
			},
		});

		const userWithoutPassword = {
			id: user.id,
			username: user.username,
			name: user.name,
		};

		return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
	} catch (error) {
		console.error("Signup error:", error);
		return NextResponse.json({ error: "Error creating user" }, { status: 500 });
	}
}
