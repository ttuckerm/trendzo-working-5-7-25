export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500 text-sm">Loading admin content...</p>
      </div>
    </div>
  );
} 