import toast from "react-hot-toast";
import { FaCheck, FaTimes } from "react-icons/fa";
import { IoClose } from "react-icons/io5";

interface ToastMessageProps {
	message: string;
	type: "success" | "error";
	t: string;
}

const ToastMessage = ({ message, type, t }: ToastMessageProps) => (
	<div className="relative min-w-[300px]">
		<div className="bg-gradient-to-r from-gray-900/95 via-purple-900/20 to-gray-900/95 text-white px-4 py-3 rounded-lg border border-purple-500/30 backdrop-blur-sm shadow-lg">
			<div className="flex items-center gap-3">
				<div
					className={`shrink-0 ${
						type === "success" ? "text-green-400" : "text-red-400"
					}`}
				>
					{type === "success" ? <FaCheck size={18} /> : <FaTimes size={18} />}
				</div>
				<p className="flex-1 text-sm font-medium text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
					{message}
				</p>
				<button
					onClick={() => toast.dismiss(t)}
					className="shrink-0 text-purple-400 hover:text-pink-400 transition-colors"
				>
					<IoClose size={18} />
				</button>
			</div>
		</div>
		{/* Progress bar */}
		<div className="absolute bottom-0 left-0 right-0 h-1 rounded-full overflow-hidden">
			<div
				className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
				style={{
					animation: "shrink 2s linear forwards",
					transformOrigin: "left",
				}}
			/>
		</div>
	</div>
);

export const customToast = {
	success: (message: string) =>
		toast.custom(
			(t: string) => <ToastMessage message={message} type="success" t={t} />,
			{
				duration: 2000,
			},
		),
	error: (message: string) =>
		toast.custom(
			(t: string) => <ToastMessage message={message} type="error" t={t} />,
			{
				duration: 2000,
			},
		),
};
