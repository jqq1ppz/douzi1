"use client";

import { useState } from "react";
import Modal from "./Modal";

interface UISettingsProps {
	currentUI: number;
	onUIChange: (uiOption: number) => void;
}

export default function UISettings({ currentUI, onUIChange }: UISettingsProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedUI, setSelectedUI] = useState(currentUI);

	const handleSave = () => {
		onUIChange(selectedUI);
		setIsModalOpen(false);
	};

	return (
		<>
			<button
				onClick={() => setIsModalOpen(true)}
				className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white"
				aria-label="UI Settings"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
					/>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
					/>
				</svg>
			</button>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="UI Settings"
			>
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Select UI Version
						</label>
						<div className="space-y-2">
							<div className="flex items-center">
								<input
									type="radio"
									id="ui1"
									name="uiOption"
									value={1}
									checked={selectedUI === 1}
									onChange={e => setSelectedUI(Number(e.target.value))}
									className="mr-2"
								/>
								<label htmlFor="ui1" className="dark:text-gray-300">
									Option 1: Select Winners & Losers first
								</label>
							</div>
							<div className="flex items-center">
								<input
									type="radio"
									id="ui2"
									name="uiOption"
									value={2}
									checked={selectedUI === 2}
									onChange={e => setSelectedUI(Number(e.target.value))}
									className="mr-2"
								/>
								<label htmlFor="ui2" className="dark:text-gray-300">
									Option 2: Select Winners & Losers after
								</label>
							</div>
						</div>
					</div>

					<div className="flex justify-end space-x-2">
						<button
							onClick={() => setIsModalOpen(false)}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
						>
							Cancel
						</button>
						<button
							onClick={handleSave}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
						>
							Save
						</button>
					</div>
				</div>
			</Modal>
		</>
	);
}
