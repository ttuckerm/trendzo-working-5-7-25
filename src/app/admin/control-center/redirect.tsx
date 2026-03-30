'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';

export default function ControlCenterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new Operations > System Health page
    router.replace('/admin/operations/health');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-gray-400 mb-4">
          Control Center has moved to Operations Center
        </p>
        <Link 
          href="/admin/operations/health"
          className="text-purple-400 hover:text-purple-300 flex items-center justify-center gap-2"
        >
          Go to System Health <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
























































































