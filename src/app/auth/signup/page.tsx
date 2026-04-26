"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaUser, FaLock, FaFont } from "react-icons/fa";

export default function SignUp() {
	const [error, setError] = useState<string>("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		try {
			const res = await fetch(`/api/auth/signup?cache-bust=${Date.now()}`, {
				method: "POST",
				cache: "no-store",
				body: JSON.stringify({
					username: formData.get("username"),
					password: formData.get("password"),
					name: formData.get("name"),
				}),
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (res.ok) {
				router.push("/auth/signin");
			} else {
				const data = await res.json();
				setError(data.error);
			}
		} catch (error) {
			console.log(error);
			setError("An error occurred during registration");
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
			<div className="relative max-w-md w-full space-y-8 p-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-xl border border-purple-500/20">
				<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-gradient-xy" />

				<div className="relative">
					<h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-8">
						Create your account
					</h2>

					{error && (
						<p className="text-center text-red-400 mb-4 bg-red-500/10 py-2 px-4 rounded-lg border border-red-500/20">
							{error}
						</p>
					)}

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-300 mb-2 ml-1"
							>
								Display Name
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaFont className="h-5 w-5 text-purple-400" />
								</div>
								<input
									id="name"
									name="name"
									type="text"
									className="block w-full pl-10 pr-3 py-3 bg-gray-900/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-transparent transition-all"
									placeholder="Enter your display name"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium text-gray-300 mb-2 ml-1"
							>
								Username
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaUser className="h-5 w-5 text-purple-400" />
								</div>
								<input
									id="username"
									name="username"
									type="text"
									required
									className="block w-full pl-10 pr-3 py-3 bg-gray-900/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-transparent transition-all"
									placeholder="Choose a username"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-300 mb-2 ml-1"
							>
								Password
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaLock className="h-5 w-5 text-purple-400" />
								</div>
								<input
									id="password"
									name="password"
									type="password"
									required
									className="block w-full pl-10 pr-3 py-3 bg-gray-900/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-transparent transition-all"
									placeholder="Create a password"
								/>
							</div>
						</div>

						<button
							type="submit"
							className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 transform hover:translate-y-[-1px] hover:shadow-lg hover:shadow-purple-500/25"
						>
							Sign up
						</button>
					</form>

					<p className="mt-6 text-center text-gray-400">
						Already have an account?{" "}
						<Link
							href="/auth/signin"
							className="text-purple-400 hover:text-purple-300 transition-colors"
						>
							Sign In
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
