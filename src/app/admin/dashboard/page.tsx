'use client';

import React, { useState } from 'react';
import { useAdminUser } from '@/hooks/useAdminUser';
import { ChairmanDashboard } from '@/components/admin/dashboard/ChairmanDashboard';
import { AgencyDashboard } from '@/components/admin/dashboard/AgencyDashboard';
import { DeveloperDashboard } from '@/components/admin/dashboard/DeveloperDashboard';
import { CreatorDashboard } from '@/components/admin/dashboard/CreatorDashboard';
import { ClipperDashboard } from '@/components/admin/dashboard/ClipperDashboard';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/types/admin';

// Development mode: set to true to enable role switching UI
const DEV_MODE = process.env.NODE_ENV === 'development';

export default function DashboardPage() {
  const { role: authRole, isLoading } = useAdminUser();
  const [devRole, setDevRole] = useState<UserRole>('chairman');
  
  // In dev mode with no auth, use the dev role selector
  // In production or with auth, use the actual role
  const effectiveRole = authRole || (DEV_MODE ? devRole : null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6C92A0]" />
      </div>
    );
  }

  // Dev mode role selector (only shown when not authenticated)
  const DevRoleSelector = () => (
    !authRole && DEV_MODE && (
      <div className="fixed bottom-4 left-4 bg-[#323434] border border-[#6C92A0]/50 rounded-lg p-3 z-50">
        <div className="text-xs text-[#6C92A0] mb-2 font-medium">Dev Mode - Select Role:</div>
        <div className="flex flex-wrap gap-2">
          {(['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => setDevRole(r)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                devRole === r 
                  ? 'bg-[#6C92A0] text-[#1E1F1F]' 
                  : 'bg-[#3A3C3C] text-[#A8A9A9] hover:bg-[#4A6B78]/30'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    )
  );

  const renderDashboard = () => {
    switch (effectiveRole) {
      case 'chairman':
        return <ChairmanDashboard />;
      case 'sub_admin':
        return <ChairmanDashboard />; // Sub-admin sees limited chairman view
      case 'agency':
        return <AgencyDashboard />;
      case 'developer':
        return <DeveloperDashboard />;
      case 'creator':
        return <CreatorDashboard />;
      case 'clipper':
        return <ClipperDashboard />;
      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#323434] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">?</span>
            </div>
            <h2 className="text-xl font-medium text-[#D4D4D4] mb-2">Unknown Role</h2>
            <p className="text-[#A8A9A9]">
              Your role could not be determined. Please contact support.
            </p>
          </div>
        );
    }
  };

  return (
    <>
      {renderDashboard()}
      <DevRoleSelector />
    </>
  );
}
