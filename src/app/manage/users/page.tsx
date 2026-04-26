"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { FaUserPlus, FaTrash, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import ModeratorList from "@/app/components/ModeratorList";

interface User {
	id: string;
	username: string;
	role: string;
}

export default function ManageUsers() {
	const { data: session } = useSession();
	const router = useRouter();
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [newUsername, setNewUsername] = useState("");
	const [editingUser, setEditingUser] = useState<string | null>(null);
	const [editUsername, setEditUsername] = useState("");
	const [editRole, setEditRole] = useState("");

	useEffect(() => {
		if (!session?.user?.username) {
			router.push("/");
			return;
		}
		fetchUsers();
	}, [session, router]);

	const fetchUsers = async () => {
		try {
			const response = await fetch("/api/users");
			const data = await response.json();
			setUsers(data);
		} catch (error) {
			console.error("Error fetching users:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!newUsername.trim()) return;

		try {
			const response = await fetch("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username: newUsername }),
			});

			if (response.ok) {
				setNewUsername("");
				fetchUsers();
			}
		} catch (error) {
			console.error("Error adding user:", error);
		}
	};

	const handleDeleteUser = async (userId: string) => {
		try {
			const response = await fetch(`/api/users?id=${userId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				fetchUsers();
			}
		} catch (error) {
			console.error("Error deleting user:", error);
		}
	};

	const handleEditUser = async (userId: string) => {
		if (!editUsername.trim()) return;

		try {
			// First update the username if it changed
			if (editUsername !== users.find(u => u.id === userId)?.username) {
				const response = await fetch(`/api/users?id=${userId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						username: editUsername,
					}),
				});

				if (!response.ok) {
					throw new Error("Failed to update username");
				}
			}

			// Then update the role if it changed
			if (editRole !== users.find(u => u.id === userId)?.role) {
				const roleResponse = await fetch("/api/users/role", {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId,
						role: editRole,
					}),
				});

				if (!roleResponse.ok) {
					throw new Error("Failed to update role");
				}
			}

			setEditingUser(null);
			setEditUsername("");
			setEditRole("");
			fetchUsers();
		} catch (error) {
			console.error("Error updating user:", error);
		}
	};

	if (loading) return <LoadingSpinner />;

	return (
		<div className="flex flex-col min-h-screen pb-16">
			<div className="flex-grow container mx-auto p-4 pt-10 space-y-8">
				{/* Header Section */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
						Manage Users
					</h1>
					<p className="text-gray-400 mt-2">Add or update user information</p>
				</div>

				{loading ? (
					<div className="flex justify-center items-center h-64">
						<LoadingSpinner />
					</div>
				) : (
					<div className="max-w-3xl mx-auto">
						{/* Add User Form */}
						<div className="max-w-2xl mx-auto">
							<form onSubmit={handleAddUser} className="flex gap-4 mb-8">
								<input
									type="text"
									value={newUsername}
									onChange={e => setNewUsername(e.target.value)}
									placeholder="Enter username"
									className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-purple-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
								/>
								<button
									type="submit"
									className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
								>
									<FaUserPlus className="w-4 h-4" />
									Add User
								</button>
							</form>

							{/* Moderator List */}
							<div className="mb-8">
								<ModeratorList onModeratorChange={fetchUsers} />
							</div>

							{/* Users List */}
							<div className="space-y-4">
								{users.map(user => (
									<div
										key={user.id}
										className="p-4 border border-purple-500/20 rounded-lg bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:bg-gray-800/50 backdrop-blur-sm transition-all duration-200"
									>
										<div className="flex items-center justify-between">
											{editingUser === user.id ? (
												<div className="flex-1 flex items-center gap-4">
													<input
														type="text"
														value={editUsername}
														onChange={e => setEditUsername(e.target.value)}
														placeholder="Enter new username"
														className="flex-1 px-4 py-2 rounded-lg bg-gray-800/50 border border-purple-500/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
													/>
													<select
														value={editRole}
														onChange={e => setEditRole(e.target.value)}
														className="px-4 py-2 rounded-lg bg-gray-800/50 border border-purple-500/20 text-white focus:outline-none focus:border-purple-500/50"
													>
														<option value="USER">User</option>
														<option value="MODERATOR">Moderator</option>
														<option value="ADMIN">Admin</option>
													</select>
													<div className="flex gap-2">
														<button
															onClick={() => handleEditUser(user.id)}
															className="p-2 text-green-400 hover:text-green-300 transition-colors"
														>
															<FaCheck className="w-4 h-4" />
														</button>
														<button
															onClick={() => {
																setEditingUser(null);
																setEditUsername("");
																setEditRole("");
															}}
															className="p-2 text-red-400 hover:text-red-300 transition-colors"
														>
															<FaTimes className="w-4 h-4" />
														</button>
													</div>
												</div>
											) : (
												<>
													<div className="flex items-center gap-4">
														<span className="text-white font-medium">
															{user.username}
														</span>
														<span
															className={`px-2 py-1 rounded text-sm ${
																user.role === "ADMIN"
																	? "bg-yellow-500/20 text-yellow-300"
																	: user.role === "MODERATOR"
																	? "bg-purple-500/20 text-purple-300"
																	: "bg-blue-500/20 text-blue-300"
															}`}
														>
															{user.role}
														</span>
													</div>
													<div className="flex gap-2">
														<button
															onClick={() => {
																setEditingUser(user.id);
																setEditUsername(user.username);
																setEditRole(user.role);
															}}
															className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
														>
															<FaEdit className="w-4 h-4" />
														</button>
														<button
															onClick={() => handleDeleteUser(user.id)}
															className="p-2 text-red-400 hover:text-red-300 transition-colors"
														>
															<FaTrash className="w-4 h-4" />
														</button>
													</div>
												</>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
