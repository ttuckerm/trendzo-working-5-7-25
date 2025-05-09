import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="max-w-md">
        <h1 className="mb-2 text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mb-4 text-2xl font-medium text-gray-700">Page Not Found</h2>
        <p className="mb-8 text-gray-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Link href="/dashboard-view">
            <Button className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 