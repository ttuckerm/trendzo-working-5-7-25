import Link from 'next/link';
import { BarChart, FileVideo, Settings } from 'lucide-react';

export default function AdminMVPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Sub Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-gray-900">MVP Management</h2>
          <div className="flex gap-4">
            <Link
              href="/admin/mvp"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <BarChart className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/mvp/templates"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <FileVideo className="w-4 h-4" />
              Templates
            </Link>
            <Link
              href="/admin/mvp/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>{children}</div>
    </div>
  );
}