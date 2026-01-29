// =============================================
// CLEANCOPY ADMIN NAVIGATION CONFIG
// Role-based navigation configuration
// =============================================

import { RESOURCES, Resource } from '@/lib/permissions';
import { UserRole } from '@/types/admin';
import {
  LayoutDashboard,
  Settings2,
  Building2,
  Users,
  Code,
  Scissors,
  UserCheck,
  Cog,
  ToggleLeft,
  Layers,
  Palette,
  Gauge,
  Gift,
  Megaphone,
  Film,
  Smartphone,
  Store,
  Link2,
  DollarSign,
  Key,
  Webhook,
  FlaskConical,
  Sliders,
  Brain,
  ScrollText,
  Activity,
  AlertTriangle,
  Zap,
  Server,
  Database,
  Target,
  Flame,
  Search,
  Cpu,
  FileStack,
  Play,
  LucideIcon,
} from 'lucide-react';

// =============================================
// TYPES
// =============================================

export interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  roles: UserRole[];
  resource?: Resource;
  children?: NavPage[];
}

export interface NavPage {
  label: string;
  href: string;
  roles?: UserRole[];
  resource?: Resource;
  badge?: 'errorCount' | 'pendingCount' | 'payoutCount';
  icon?: LucideIcon;
}

// =============================================
// NAVIGATION STRUCTURE
// =============================================

export const ADMIN_NAVIGATION: NavSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/admin/dashboard',
    roles: ['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'],
    resource: RESOURCES.DASHBOARD,
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: Activity,
    href: '/admin/operations',
    roles: ['chairman'],
    resource: RESOURCES.CONTROL_CENTER,
    children: [
      { label: 'Overview', href: '/admin/operations', icon: LayoutDashboard },
      { label: 'Model Performance', href: '/admin/operations/model', icon: Target },
      { label: 'Training Pipeline', href: '/admin/operations/training', icon: Database },
      { label: 'Training Data', href: '/admin/operations/training/data', icon: FileStack },
      { label: 'Training Jobs', href: '/admin/operations/training/jobs', icon: Play },
      { label: 'Model Versions', href: '/admin/operations/training/models', icon: Cpu },
      { label: 'Viral Scrape', href: '/admin/operations/training/viral-scrape', icon: Flame },
      { label: 'Data Explorer', href: '/admin/operations/data-explorer', icon: Search },
      { label: 'System Health', href: '/admin/operations/health', icon: Server },
      { label: 'Experiments', href: '/admin/operations/experiments', icon: FlaskConical },
      { label: 'Alerts', href: '/admin/operations/alerts', icon: AlertTriangle, badge: 'errorCount' },
    ],
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: Building2,
    href: '/admin/organization',
    roles: ['chairman', 'sub_admin', 'agency'],
    children: [
      { label: 'Overview', href: '/admin/organization', roles: ['chairman', 'sub_admin'], icon: LayoutDashboard },
      { label: 'Sub-Admins', href: '/admin/organization/sub-admins', roles: ['chairman'], resource: RESOURCES.SUB_ADMINS, icon: UserCheck },
      { label: 'Agencies', href: '/admin/organization/agencies', roles: ['chairman', 'sub_admin'], resource: RESOURCES.AGENCIES, icon: Building2 },
      { label: 'Creators', href: '/admin/organization/creators', roles: ['chairman', 'sub_admin', 'agency'], resource: RESOURCES.CREATORS, icon: Users },
      { label: 'Developers', href: '/admin/organization/developers', roles: ['chairman', 'sub_admin'], resource: RESOURCES.DEVELOPERS, icon: Code },
      { label: 'Clippers', href: '/admin/organization/clippers', roles: ['chairman', 'sub_admin'], resource: RESOURCES.CLIPPERS, icon: Scissors },
      { label: 'Independent Creators', href: '/admin/organization/independent', roles: ['chairman', 'sub_admin'], resource: RESOURCES.INDEPENDENT_CREATORS, icon: Users },
    ],
  },
  {
    id: 'config',
    label: 'Platform Config',
    icon: Cog,
    href: '/admin/config',
    roles: ['chairman'],
    children: [
      { label: 'Feature Toggles', href: '/admin/config/feature-toggles', resource: RESOURCES.FEATURE_TOGGLES, icon: ToggleLeft },
      { label: 'Tier Management', href: '/admin/config/tiers', resource: RESOURCES.TIERS, icon: Layers },
      { label: 'White Label', href: '/admin/config/white-label', resource: RESOURCES.WHITE_LABEL, icon: Palette },
      { label: 'Usage & Quotas', href: '/admin/config/quotas', resource: RESOURCES.QUOTAS, icon: Gauge },
    ],
  },
  {
    id: 'rewards',
    label: 'Rewards',
    icon: Gift,
    href: '/admin/rewards',
    roles: ['chairman', 'sub_admin', 'agency', 'developer', 'creator', 'clipper'],
    children: [
      { label: 'Overview', href: '/admin/rewards', roles: ['chairman'], icon: LayoutDashboard },
      { label: 'Platform Campaigns', href: '/admin/rewards/platform-campaigns', resource: RESOURCES.PLATFORM_CAMPAIGNS, icon: Megaphone },
      { label: 'Content Campaigns', href: '/admin/rewards/content-campaigns', resource: RESOURCES.CONTENT_CAMPAIGNS, icon: Film },
      { label: 'Mini App Campaigns', href: '/admin/rewards/app-campaigns', resource: RESOURCES.APP_CAMPAIGNS, icon: Smartphone },
      { label: 'Mini App Store', href: '/admin/rewards/app-store', resource: RESOURCES.MINI_APP_STORE, icon: Store },
      { label: 'Affiliate Program', href: '/admin/rewards/affiliate', resource: RESOURCES.AFFILIATE, icon: Link2 },
      { label: 'Payouts', href: '/admin/rewards/payouts', roles: ['chairman'], resource: RESOURCES.PAYOUTS, icon: DollarSign, badge: 'payoutCount' },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Link2,
    href: '/admin/integrations',
    roles: ['chairman', 'agency', 'developer'],
    children: [
      { label: 'API Management', href: '/admin/integrations/api', resource: RESOURCES.API_MANAGEMENT, icon: Key },
      { label: 'Webhooks', href: '/admin/integrations/webhooks', resource: RESOURCES.WEBHOOKS, icon: Webhook },
    ],
  },
  {
    id: 'ml-lab',
    label: 'ML Lab',
    icon: FlaskConical,
    href: '/admin/ml-lab',
    roles: ['chairman'],
    resource: RESOURCES.ML_LAB,
    children: [
      { label: 'Calibration', href: '/admin/ml-lab/calibration', resource: RESOURCES.CALIBRATION, icon: Sliders },
      { label: 'Models', href: '/admin/ml-lab/models', icon: Brain },
    ],
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: ScrollText,
    href: '/admin/audit-log',
    roles: ['chairman', 'sub_admin'],
    resource: RESOURCES.AUDIT_LOG,
  },
];

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Get section by ID
 */
export function getSection(id: string): NavSection | undefined {
  return ADMIN_NAVIGATION.find(s => s.id === id);
}

/**
 * Get current section from pathname
 */
export function getCurrentSection(pathname: string): NavSection | undefined {
  // Sort by href length descending to match most specific first
  const sortedNav = [...ADMIN_NAVIGATION].sort((a, b) => b.href.length - a.href.length);
  
  for (const section of sortedNav) {
    if (pathname === section.href || pathname.startsWith(section.href + '/')) {
      return section;
    }
  }
  
  return undefined;
}

/**
 * Get current page from pathname
 */
export function getCurrentPage(pathname: string, section: NavSection): NavPage | undefined {
  if (!section.children) return undefined;
  
  // Sort by href length descending to match most specific first
  const sortedPages = [...section.children].sort((a, b) => b.href.length - a.href.length);
  
  for (const page of sortedPages) {
    if (pathname === page.href || pathname.startsWith(page.href + '/')) {
      return page;
    }
  }
  
  return undefined;
}

/**
 * Get breadcrumbs for current pathname
 */
export function getBreadcrumbs(pathname: string): Array<{ label: string; href: string }> {
  const breadcrumbs: Array<{ label: string; href: string }> = [];
  
  const section = getCurrentSection(pathname);
  if (section) {
    breadcrumbs.push({ label: section.label, href: section.href });
    
    if (section.children) {
      const page = getCurrentPage(pathname, section);
      if (page && page.href !== section.href) {
        breadcrumbs.push({ label: page.label, href: page.href });
      }
    }
  }
  
  return breadcrumbs;
}

/**
 * Filter navigation based on user role
 */
export function filterNavigationByRole(
  navigation: NavSection[],
  userRole: UserRole
): NavSection[] {
  return navigation
    .filter(section => section.roles.includes(userRole))
    .map(section => ({
      ...section,
      children: section.children?.filter(page => 
        !page.roles || page.roles.includes(userRole)
      ),
    }))
    .filter(section => !section.children || section.children.length > 0);
}



