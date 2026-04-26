import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	const isMaintenance = process.env.NEXT_PUBLIC_IS_MAINTENANCE === "true";

	// If maintenance mode is enabled and not already on the maintenance page
	if (isMaintenance && !request.nextUrl.pathname.startsWith("/maintenance")) {
		return NextResponse.redirect(new URL("/maintenance", request.url));
	}

	return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
