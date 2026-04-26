import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";

import { Toaster } from "react-hot-toast";
import Footer from "./components/Footer";
import Providers from "./providers/Providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "豆子",
	description: "豆子App 记录游戏结果",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const hasPadding = (children as any)?.props?.pageConfig?.hasPadding ?? true;

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-gray-900`}
			>
				<Providers>
					<div className="flex min-h-screen flex-col">
						<NavBar />
						<main
							className={`flex-1 ${
								hasPadding ? "px-2 py-0 sm:px-4 sm:py-0" : ""
							}`}
						>
							{children}
						</main>
						<Footer />
					</div>
					<Toaster
						position="top-center"
						toastOptions={{
							className: "dark",
							duration: 3000,
							style: {
								background: "rgba(17, 24, 39, 0.95)", // dark gray-900
								color: "#fff",
								padding: "16px",
								borderRadius: "8px",
								backdropFilter: "blur(8px)",
								border: "1px solid rgba(139, 92, 246, 0.3)",
								boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
								fontSize: "14px",
								maxWidth: "350px",
							},
							success: {
								style: {
									background: "rgba(17, 24, 39, 0.95)",
									border: "1px solid rgba(16, 185, 129, 0.3)", // Green border
								},
								iconTheme: {
									primary: "#10B981",
									secondary: "#FFFFFF",
								},
							},
							error: {
								style: {
									background: "rgba(17, 24, 39, 0.95)",
									border: "1px solid rgba(239, 68, 68, 0.3)", // Red border
								},
								iconTheme: {
									primary: "#EF4444",
									secondary: "#FFFFFF",
								},
							},
						}}
					/>
				</Providers>
			</body>
		</html>
	);
}
