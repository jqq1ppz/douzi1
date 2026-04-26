interface PlayerTagProps {
	player: string;
	onRemove: () => void;
}

export default function PlayerTag({ player, onRemove }: PlayerTagProps) {
	return (
		<div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
			<span>{player}</span>
			<button onClick={onRemove} className="text-gray-500 hover:text-gray-700">
				×
			</button>
		</div>
	);
}
