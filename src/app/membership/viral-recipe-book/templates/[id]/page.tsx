"use client";

import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { isTemplateMiniUIEnabled } from '@/config/flags';
import TemplateMiniUI from '@/components/templateMiniUI/TemplateMiniUI';

export default function TemplateMiniUIEntry() {
  const params = useParams();
  const query = useSearchParams();
  const templateId = String(params?.id || '');

  // If a hash param is passed (?hash=#validate), set it as location.hash on mount
  useEffect(() => {
    const initialHash = query?.get('hash') || '';
    if (initialHash) {
      const h = initialHash.startsWith('#') ? initialHash : `#${initialHash}`;
      if (typeof window !== 'undefined') window.location.hash = h;
    }
  }, [query]);

  // Fallback to legacy behavior if flag is OFF (simple redirect back to book page)
  const enabled = isTemplateMiniUIEnabled(typeof window !== 'undefined' ? window.location.href : undefined);
  if (!enabled) {
    if (typeof window !== 'undefined') {
      const url = `/membership/viral-recipe-book`;
      window.location.replace(url);
    }
    return null;
  }

  // TODO: fetch platform/user if required; default to tiktok for now
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TemplateMiniUI templateId={templateId} platform="tiktok" />
    </div>
  );
}


