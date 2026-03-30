'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { IconSidebar } from './IconSidebar';
import { SectionSidebar } from './SectionSidebar';
import { getCurrentSection, NavSection } from './navigation-config';

interface BadgeCounts {
  errorCount?: number;
  pendingCount?: number;
  payoutCount?: number;
}

export function AdminSidebar() {
  const pathname = usePathname();
  const currentSection = getCurrentSection(pathname);
  const [hoveredSection, setHoveredSection] = useState<NavSection | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState<BadgeCounts>({});

  // Fetch badge counts
  useEffect(() => {
    async function fetchBadgeCounts() {
      try {
        // Fetch error count from system health
        const healthRes = await fetch('/api/system-health/errors');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setBadgeCounts(prev => ({
            ...prev,
            errorCount: healthData.errors?.length || 0,
          }));
        }

        // Could add more badge count fetches here
        // const payoutsRes = await fetch('/api/admin/payouts/pending-count');
        // etc.
      } catch (error) {
        console.error('Failed to fetch badge counts:', error);
      }
    }

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Determine which section to show in the section sidebar
  // Priority: hovered section > current section (if has children)
  const activeSection = hoveredSection || (currentSection?.children ? currentSection : null);
  const showSectionSidebar = !!activeSection?.children;

  // Auto-pin when navigating to a section with children
  useEffect(() => {
    if (currentSection?.children) {
      setIsPinned(true);
    }
  }, [currentSection]);

  return (
    <div className="flex h-full">
      {/* Icon Navigation */}
      <IconSidebar
        onSectionHover={(section) => {
          if (section?.children) {
            setHoveredSection(section);
          } else {
            setHoveredSection(null);
          }
        }}
        onSectionSelect={(section) => {
          if (section.children) {
            setIsPinned(true);
          } else {
            setIsPinned(false);
          }
        }}
      />
      
      {/* Section Sidebar (expandable) */}
      {showSectionSidebar && activeSection && (
        <SectionSidebar
          section={activeSection}
          isOpen={showSectionSidebar}
          badgeCounts={badgeCounts}
          onClose={() => {
            if (!isPinned || hoveredSection !== currentSection) {
              setHoveredSection(null);
            }
          }}
        />
      )}
    </div>
  );
}

export default AdminSidebar;


























































































