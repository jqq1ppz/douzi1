import { ImSpinner8 } from "react-icons/im";

interface Props {
	className?: string;
	width?: string;
	height?: string;
}

export default function LoadingSpinner2({
	className = "text-purple-500",
	width = "w-8",
	height = "h-8",
}: Props) {
	return (
		<div className="flex items-center justify-center p-8 rounded-lg bg-gray-800/50">
			<ImSpinner8 className={`${width} ${height} ${className} animate-spin`} />
		</div>
	);
}
