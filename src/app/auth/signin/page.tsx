"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaUser, FaLock } from "react-icons/fa";

export default function SignIn() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const result = await signIn("credentials", {
			username,
			password,
			redirect: false,
		});

		if (result?.error) {
			alert(result.error);
		} else {
			router.push("/");
			router.refresh();
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
			<div className="relative max-w-md w-full space-y-8 p-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-xl border border-purple-500/20">
				{/* Animated gradient border */}
				<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 animate-gradient-xy" />

				<div className="relative">
					<h2 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-8">
						Sign in to your account
					</h2>

					<form className="mt-8 space-y-6" onSubmit={handleSubmit}>
						<div className="space-y-4">
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
										type="text"
										required
										value={username}
										onChange={e => setUsername(e.target.value)}
										className="block w-full pl-10 pr-3 py-3 bg-gray-900/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-transparent transition-all"
										placeholder="Enter your username"
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
										type="password"
										required
										value={password}
										onChange={e => setPassword(e.target.value)}
										className="block w-full pl-10 pr-3 py-3 bg-gray-900/50 border border-purple-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-transparent transition-all"
										placeholder="Enter your password"
									/>
								</div>
							</div>
						</div>

						<button
							type="submit"
							className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium transition-all duration-200 transform hover:translate-y-[-1px] hover:shadow-lg hover:shadow-purple-500/25"
						>
							Sign in
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
