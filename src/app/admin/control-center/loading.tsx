export default function ControlCenterLoading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4" />
        <p className="text-gray-500 text-sm">Loading Control Center...</p>
      </div>
    </div>
  );
}
