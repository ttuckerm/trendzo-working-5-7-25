'use client';

import React from 'react';
import { useImpersonation } from '@/hooks/useImpersonation';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { ROLE_LABELS, ROLE_COLORS } from '@/types/admin';
import { cn } from '@/lib/utils';

export function ImpersonationBanner() {
  const { 
    isImpersonating, 
    impersonatedUser, 
    realUser,
    stopImpersonation,
    isLoading,
  } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  const roleLabel = ROLE_LABELS[impersonatedUser.role] || impersonatedUser.role;

  return (
    <div className="bg-yellow-500 text-black px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Warning & User Info */}
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-yellow-900" />
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Viewing as:
            </span>
            <span className="font-bold">
              {impersonatedUser.display_name || impersonatedUser.email}
            </span>
            <span className="px-2 py-0.5 bg-black/20 rounded text-xs font-semibold uppercase">
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Center: Real user reminder */}
        <div className="hidden md:flex items-center gap-2 text-sm opacity-75">
          <span>You are:</span>
          <span className="font-medium">{realUser?.display_name || realUser?.email}</span>
        </div>

        {/* Right: Exit button */}
        <button
          onClick={stopImpersonation}
          disabled={isLoading}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 bg-black/20 hover:bg-black/30 rounded-lg text-sm font-medium transition-colors',
            isLoading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <X size={14} />
          )}
          Exit Impersonation
        </button>
      </div>
    </div>
  );
}

export default ImpersonationBanner;
