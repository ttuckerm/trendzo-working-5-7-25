"use client";
import React, { useState } from "react";
import {
  Sidebar, 
  SidebarBody, 
  SidebarLink, 
  SidebarNavSection, 
  useSidebar, // Import useSidebar hook
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, UserCog, Settings, LogOut, // Base icons
  ImageIcon, Edit, BarChart2, Wand2, BarChart, AlertCircle, Calendar, Users, 
  ChevronUp, Lock, Crown, Compass, Sparkles, MailCheck, BookOpen, Music, Volume2, X // Icons from old sidebar
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { usePathname } from 'next/navigation';
import { useSubscription, SubscriptionTier } from '@/lib/contexts/SubscriptionContext';

// Match LinkProps from ui/sidebar.tsx for consistency
interface AppLinkProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  subLinks?: AppLinkProps[];
  isActive?: boolean;
  isLocked?: boolean;
  requiredTier?: SubscriptionTier;
}

interface AppNavSectionProps {
  title: string;
  items: AppLinkProps[];
  defaultExpanded?: boolean;
}

// Internal component for dynamic logo display
const SidebarHeaderContent = () => {
  const { open, hovered } = useSidebar(); // Consumes context from parent Sidebar
  const shouldShowFullLogo = open || hovered; 
  return shouldShowFullLogo ? <Logo /> : <LogoIcon />;
};

// Internal component for dynamic footer display
const SidebarFooterContent = () => {
  const { open, hovered } = useSidebar();
  const isVisuallyExpanded = open || hovered;

  if (!isVisuallyExpanded) return null; // Don't show footer if fully collapsed and not hovered

  return (
    <div className="border-t border-neutral-200 dark:border-neutral-700 p-2 text-center">
      <div className="text-xs text-neutral-500 dark:text-neutral-400">
        {open ? ( // If pinned open, show full footer
          <>
            <p>© {new Date().getFullYear()} Trendzo</p>
            <p className="mt-0.5">Making content creation easier</p>
          </>
        ) : ( // If only hovered (and thus !open), show compact footer
          <p>© Trendzo</p>
        )}
      </div>
    </div>
  );
};

export function NewAppSidebar() {
  const pathname = usePathname();
  const { tier, canAccess } = useSubscription();
  // This state determines if the sidebar is Pinned open (true) or in hover-to-expand mode (false)
  const [sidebarPinnedOpen, setSidebarPinnedOpen] = useState(false); 

  const navStructure: AppNavSectionProps[] = [
    {
      title: "Main",
      defaultExpanded: true,
      items: [
        {
          label: "Dashboard",
          href: "/dashboard-view",
          icon: <LayoutDashboard size={18} />,
          isActive: pathname === '/dashboard-view' || pathname === '/dashboard',
        },
        {
          label: "Template Library",
          href: "/dashboard-view/template-library",
          icon: <ImageIcon size={18} />,
          isActive: pathname?.startsWith('/dashboard-view/template-library') || pathname?.startsWith('/template-library') || pathname?.startsWith('/(dashboard)/template-library'),
        },
        {
          label: "Template Editor",
          href: "/dashboard-view/template-editor",
          icon: <Edit size={18} />,
          isActive: pathname?.startsWith('/dashboard-view/template-editor') || pathname?.startsWith('/editor'),
        },
        {
          label: "Video Analyzer Tools",
          href: "/dashboard-view/video-analyzer",
          icon: <Compass size={18} />,
          isActive: pathname?.startsWith('/dashboard-view/video-analyzer') || pathname?.startsWith('/dashboard/video-analyzer'),
        },
        {
          label: "Documentation",
          href: "/documentation",
          icon: <BookOpen size={18} />,
          isActive: pathname?.startsWith('/documentation'),
        },
      ],
    },
    {
      title: "Analytics",
      defaultExpanded: true,
      items: [
        {
          label: "Trend Insights",
          href: "/dashboard-view/analytics/trend-insights",
          icon: <BarChart2 size={18} />,
          isActive: pathname === '/dashboard-view/analytics/trend-insights' || pathname === '/analytics/trend-insights',
        },
        {
          label: "Sound Trends",
          href: "/dashboard-view/sound-trends",
          icon: <Volume2 size={18} />,
          isActive: pathname === '/dashboard-view/sound-trends' || pathname === '/sound-trends',
        },
        {
          label: "Performance Metrics",
          href: "/dashboard-view/analytics/performance",
          icon: <BarChart size={18} />,
          isActive: pathname === '/dashboard-view/analytics/performance',
          requiredTier: "premium",
          isLocked: !canAccess("premium"),
        },
        {
          label: "Advanced Insights",
          href: "/dashboard-view/analytics/advanced-insights",
          icon: <Sparkles size={18} />,
          isActive: pathname === '/dashboard-view/analytics/advanced-insights' || pathname === '/analytics/advanced-insights',
          requiredTier: "business",
          isLocked: !canAccess("business"),
        },
      ],
    },
    {
      title: "Premium Features",
      defaultExpanded: true,
      items: [
        {
          label: "Performance Analytics", 
          href: "/analytics", 
          icon: <BarChart2 size={18} />,
          isActive: pathname === '/analytics' || pathname === '/(dashboard)/analytics',
          requiredTier: "premium",
          isLocked: false, 
        },
        {
          label: "Newsletter Analytics",
          href: "/dashboard-view/analytics/newsletter",
          icon: <MailCheck size={18} />,
          isActive: pathname?.includes('/analytics/newsletter'),
          requiredTier: "premium",
          isLocked: !canAccess("premium"),
        },
        {
          label: "Remix Analytics",
          href: "/dashboard-view/analytics/remix-stats",
          icon: <BarChart size={18} />,
          isActive: pathname?.includes('/analytics/remix-stats'),
          requiredTier: "premium",
          isLocked: !canAccess("premium"),
        },
        {
          label: "Template Remix",
          href: "/dashboard-view/remix",
          icon: <Sparkles size={18} />,
          isActive: pathname?.includes('/remix') || pathname?.includes('/dashboard-view/remix'),
          requiredTier: "premium",
          isLocked: !canAccess("premium"),
        },
      ],
    },
    {
      title: "Business Features",
      defaultExpanded: true,
      items: [
        {
          label: "Trend Prediction",
          href: "/dashboard-view/trend-predictions-dashboard",
          icon: <BarChart size={18} />,
          isActive: pathname?.startsWith('/dashboard-view/trend-predictions-dashboard'),
          requiredTier: "business",
          isLocked: false, 
        },
        {
          label: "AI Script Generator",
          href: "/ai-scripts",
          icon: <AlertCircle size={18} />,
          isActive: pathname === '/ai-scripts',
          requiredTier: "business",
          isLocked: !canAccess("business"),
        },
        {
          label: "Content Calendar",
          href: "/calendar",
          icon: <Calendar size={18} />,
          isActive: pathname === '/calendar',
          requiredTier: "business",
          isLocked: !canAccess("business"),
        },
        {
          label: "Creator Marketplace",
          href: "/marketplace",
          icon: <Users size={18} />,
          isActive: pathname === '/marketplace',
          requiredTier: "business",
          isLocked: !canAccess("business"),
        },
      ],
    },
  ];

  const planColors = {
    free: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
    premium: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700',
    business: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700',
  };

  const planLabel = {
    free: 'Free Plan',
    premium: 'Premium Plan',
    business: 'Business Plan',
  };

  const upgradeBtnColors = {
    free: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-400',
    premium: 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-400',
    business: 'bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600',
  };

  const upgradeLabel = {
    free: 'Upgrade to Premium',
    premium: 'Upgrade to Business',
    business: 'Highest Tier',
  };

  return (
    <Sidebar open={sidebarPinnedOpen} setOpen={setSidebarPinnedOpen} defaultOpen={false}>
      <SidebarBody className="justify-between gap-4">
        {/* Header Section (Logo) */}
        <div className="px-2 py-2 border-b border-neutral-200 dark:border-neutral-700">
          <SidebarHeaderContent />
        </div>
        
        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {/* Current Plan Card - only shown if sidebar is pinned open */}
          {sidebarPinnedOpen && (
            <div className={cn("mx-2 mb-4 rounded-lg border p-3", planColors[tier])}>
              <div className="mb-1.5 flex items-center gap-2">
                <Crown 
                  size={16} 
                  className={tier === 'free' ? 'text-gray-500 dark:text-neutral-400' : tier === 'premium' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'} 
                />
                <span className="font-medium text-sm">{planLabel[tier]}</span>
              </div>
              {tier !== 'business' && (
                <button
                  className={cn("mt-1.5 w-full rounded-md px-3 py-1.5 text-xs font-medium transition-colors", upgradeBtnColors[tier])}
                >
                  {upgradeLabel[tier]}
                </button>
              )}
            </div>
          )}

          {/* Navigation Sections */}
          {navStructure.map((section) => (
            <SidebarNavSection key={section.title} title={section.title} defaultExpanded={section.defaultExpanded}>
              {section.items.map((item) => (
                <SidebarLink key={item.label} link={item} />
              ))}
            </SidebarNavSection>
          ))}
        </div>

        {/* Footer Section */}
        <SidebarFooterContent />
      </SidebarBody>
    </Sidebar>
  );
}

export const Logo = () => {
  return (
    <Link
      href="/dashboard-view"
      className="flex items-center gap-2.5 py-1 relative z-20 px-1.5"
    >
      <Image 
        src="/images/logos/trendzo-full-logo.svg" 
        alt="Trendzo Logo" 
        width={120} 
        height={32} 
        className="h-auto dark:invert-[0.15]"
      />
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link
      href="/dashboard-view"
      className="flex items-center justify-center py-1 relative z-20"
    >
       <Image 
        src="/images/logos/trendzo-flame-icon.svg" 
        alt="Trendzo Icon" 
        width={28} 
        height={28} 
        className="h-auto dark:invert-[0.15]"
      />
    </Link>
  );
};

// Dummy component to represent where your page content would go - REMOVE THIS if NewAppSidebar is used in a layout
// const CurrentPageContentPlaceholder = () => {
//   return (
//     <div className="flex flex-1 h-full overflow-auto">
//       <div className="p-4 md:p-8 rounded-tl-2xl bg-white dark:bg-neutral-900 flex flex-col gap-4 flex-1">
//         <h1 className="text-2xl font-semibold">Page Content Area</h1>
//         <p>Your application\'s main content will be rendered here, to the right of the sidebar.</p>
//       </div>
//     </div>
//   );
// }; 