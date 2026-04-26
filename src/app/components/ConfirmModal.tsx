import { ReactNode } from "react";
import Modal from "./Modal";

interface ConfirmModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title?: string;
	message?: ReactNode;
	confirmText?: string;
	confirmButtonClass?: string;
	isConfirmDisabled?: boolean;
}

export default function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title = "Confirm Action",
	message = "Are you sure you want to proceed?",
}: ConfirmModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} title={title}>
			<div className="space-y-4">
				<p className="text-gray-200">{message}</p>
				<div className="flex justify-end gap-3 mt-6">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-gray-500/10 text-gray-300 rounded-lg hover:bg-gray-500/20 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg disabled:from-gray-600 disabled:to-gray-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
					>
						Confirm
					</button>
				</div>
			</div>
		</Modal>
	);
}
