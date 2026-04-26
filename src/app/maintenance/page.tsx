import { FaTools } from "react-icons/fa";

export default function MaintenancePage() {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
			<div className="max-w-md w-full text-center space-y-6">
				<div className="flex justify-center">
					<FaTools className="h-16 w-16 text-gray-400" />
				</div>
				<h1 className="text-3xl font-bold text-gray-900">Under Maintenance</h1>
				<p className="text-gray-600">
					Currently performing scheduled maintenance. The douzi app be back
					online shortly.
				</p>
				<div className="pt-4">
					<p className="text-sm text-gray-500">Expected completion time: ---</p>
				</div>
			</div>
		</div>
	);
}
