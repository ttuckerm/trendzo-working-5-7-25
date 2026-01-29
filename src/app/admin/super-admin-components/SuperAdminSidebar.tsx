"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import PowerIndicator from './PowerIndicator';
import styles from './super-admin.module.css';

interface NavItem {
  label: string;
  href: string;
}

interface NavGroup {
  title: string;
  icon: string;
  expandable: boolean;
  expanded?: boolean;
  active?: boolean;
  items: NavItem[];
  badge?: string;
}

const navigationStructure: NavGroup[] = [
  {
    title: "Dashboard",
    icon: "🏠",
    expandable: true,
    expanded: false,
    items: [
      { label: "Quick Actions Dashboard", href: "/admin/dashboard" },
      { label: "Platform Overview", href: "/admin/dashboard" },
      { label: "Real-time Alerts", href: "/admin/dashboard" },
      { label: "Performance Snapshot", href: "/admin/dashboard" }
    ]
  },
  {
    title: "AI Brain Interface",
    icon: "🧠",
    expandable: true,
    expanded: true,
    active: true,
    items: [
      { label: "Conversational Framework", href: "/admin/ai-brain?section=conversational-framework" },
      { label: "Knowledge Extraction", href: "/admin/ai-brain?section=knowledge-extraction" },
      { label: "Framework Visualization", href: "/admin/ai-brain?section=framework-visualization" },
      { label: "Emotional Resonance", href: "/admin/ai-brain?section=emotional-resonance" },
      { label: "Multi-Sensory Profiles", href: "/admin/ai-brain?section=multi-sensory-profiles" }
    ]
  },
  {
    title: "Operations Center",
    icon: "🎯",
    expandable: true,
    expanded: false,
    badge: "NEW",
    items: [
      { label: "Smart Mode Dashboard", href: "/admin/operations-center" },
      { label: "Daily Workflow Control", href: "/admin/operations-center" },
      { label: "System Monitoring", href: "/admin/operations-center" },
      { label: "Module Status", href: "/admin/operations-center" },
      { label: "Background Intelligence", href: "/admin/operations-center" }
    ]
  },
  {
    title: "Viral Prediction Engine",
    icon: "🚀",
    expandable: true,
    expanded: false,
    badge: "GOD MODE",
    items: [
      { label: "Framework-Based Analysis", href: "/admin/viral-prediction-complete" },
      { label: "Viral Analysis Dashboard", href: "/admin/viral-prediction" },
      { label: "Hook Detection System", href: "/admin/viral-prediction/hooks" },
      { label: "God Mode Analysis", href: "/admin/viral-prediction/god-mode" },
      { label: "Inception Mode Studio", href: "/admin/viral-prediction/inception" },
      { label: "Real-time Monitoring", href: "/admin/viral-prediction/monitor" },
      { label: "Performance Analytics", href: "/admin/viral-prediction/analytics" }
    ]
  },
  {
    title: "Template Management",
    icon: "📝",
    expandable: true,
    items: [
      { label: "Template Library", href: "/admin/studio" },
      { label: "Template Analytics", href: "/admin/studio" },
      { label: "Template Categorization", href: "/admin/studio" },
      { label: "Viral Pattern Analysis", href: "/admin/studio" },
      { label: "Performance Tracking", href: "/admin/studio" }
    ]
  },
  {
    title: "Expert Insights",
    icon: "💡",
    expandable: true,
    items: [
      { label: "Expert Review Queues", href: "/admin/insights" },
      { label: "Expert Annotations", href: "/admin/insights" },
      { label: "Format Management", href: "/admin/insights" },
      { label: "Hook Genie Control", href: "/admin/insights" },
      { label: "Manual Override Controls", href: "/admin/insights" },
      { label: "Audit Trail System", href: "/admin/insights" }
    ]
  },
  {
    title: "Analytics",
    icon: "📊",
    expandable: true,
    items: [
      { label: "Platform Metrics", href: "/admin/analytics" },
      { label: "User Behavior", href: "/admin/analytics" },
      { label: "Revenue Analytics", href: "/admin/analytics" },
      { label: "Prediction Accuracy", href: "/admin/analytics" },
      { label: "Market Intelligence", href: "/admin/analytics" },
      { label: "Conversion Optimization", href: "/admin/analytics" }
    ]
  },
  {
    title: "User Management",
    icon: "👥",
    expandable: true,
    items: [
      { label: "User Database", href: "/admin/users" },
      { label: "Tier Management", href: "/admin/users" },
      { label: "Access Control", href: "/admin/users" },
      { label: "CRM Integration", href: "/admin/users" },
      { label: "Growth Systems", href: "/admin/users" },
      { label: "Personalized Onboarding", href: "/admin/users" }
    ]
  },
  {
    title: "System Health",
    icon: "⚙️",
    expandable: true,
    items: [
      { label: "System Configuration", href: "/admin/system" },
      { label: "Feature Management", href: "/admin/system" },
      { label: "Alert Management", href: "/admin/system" },
      { label: "Implementation Preview", href: "/admin/system" },
      { label: "Performance Monitoring", href: "/admin/system" }
    ]
  },
  {
    title: "API Management",
    icon: "🔌",
    expandable: true,
    items: [
      { label: "API Configuration", href: "/admin/api" },
      { label: "Third-party Integrations", href: "/admin/api" },
      { label: "Webhook Management", href: "/admin/api" },
      { label: "Sound API Config", href: "/admin/api" },
      { label: "Rate Limiting Controls", href: "/admin/api" }
    ]
  },
  {
    title: "Processing Pipeline",
    icon: "⚙️",
    expandable: false,
    expanded: true,
    active: true,
    items: [
      { label: "Pipeline", href: "/admin/pipeline" }
    ]
  },
  {
    title: "Content Analysis",
    icon: "🧬",
    expandable: false,
    items: [
      { label: "Viral Recipe Book", href: "/admin/recipe-book" },
      { label: "My Drafts Analyzer", href: "/admin/draft-analyzer" }
    ]
  },
  {
    title: "ETL Dashboard",
    icon: "📈",
    expandable: true,
    items: [
      { label: "Data Import/Export", href: "/admin/etl-dashboard" },
      { label: "ETL Process Monitoring", href: "/admin/etl-dashboard" },
      { label: "Data Quality Checks", href: "/admin/etl-dashboard" },
      { label: "Scheduled Jobs", href: "/admin/etl-dashboard" },
      { label: "Error Logs", href: "/admin/etl-dashboard" }
    ]
  },
  {
    title: "Newsletter",
    icon: "📰",
    expandable: true,
    items: [
      { label: "Campaign Management", href: "/admin/newsletter" },
      { label: "Subscriber Analytics", href: "/admin/newsletter" },
      { label: "Template Generation", href: "/admin/newsletter" },
      { label: "A/B Testing", href: "/admin/newsletter" },
      { label: "Performance Tracking", href: "/admin/newsletter" }
    ]
  },
  {
    title: "Marketing Studio",
    icon: "🛍️",
    expandable: true,
    items: [
      { label: "Magic Actions", href: "/admin/marketing-studio" },
      { label: "Engagement Funnels", href: "/admin/marketing-studio" },
      { label: "Brand Partnerships", href: "/admin/marketing-studio" },
      { label: "Social Media Integration", href: "/admin/marketing-studio" }
    ]
  }
  ,
  {
    title: "POC Checklist",
    icon: "✅",
    expandable: true,
    expanded: true,
    items: [
      { label: "1) System Health", href: "/api/admin/master-orchestrator?action=status" },
      { label: "2) ApifyScraper Dashboard", href: "/admin/apify-scraper" },
      { label: "3) Template Discovery", href: "/admin/template-analyzer" },
      { label: "4) Feature Decomposer", href: "/admin/feature-decomposer" },
      { label: "5) Draft Analyzer / Predict", href: "/video/predict" },
      { label: "6) Prediction Validation", href: "/admin/prediction-validation" },
      { label: "7) Dashboards / Reporting", href: "/admin/super-admin" }
    ]
  }
];

interface SuperAdminSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

function SidebarContent({ isOpen = true, onToggle }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>(() => {
    const initial: { [key: string]: boolean } = {};
    navigationStructure.forEach((group) => {
      initial[group.title] = group.expanded || false;
    });
    return initial;
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isItemActive = (href: string) => {
    const [path, query] = href.split('?');

    if (pathname !== path) {
      return false;
    }

    if (query) {
      const hrefParams = new URLSearchParams(query);
      let allParamsMatch = true;
      hrefParams.forEach((value, key) => {
        if (searchParams.get(key) !== value) {
          allParamsMatch = false;
        }
      });
      return allParamsMatch && searchParams.toString().includes(query);
    }

    return !searchParams.toString();
  };

  return (
    <aside className={`${styles.superSidebar} ${isOpen ? styles.open : ''}`}>
      <PowerIndicator />
      
      <div className={styles.adminLogoSection}>
        <div className={styles.adminLogo}>
          <span>TRENDZO</span>
          <span className={styles.adminBadge}>SUPER ADMIN</span>
        </div>
      </div>

      <nav className={styles.adminNav}>
        {navigationStructure.map((group) => (
          <div key={group.title} className={styles.adminNavGroup}>
            <div
              className={`${styles.adminNavItem} ${styles.expandable} ${
                expandedGroups[group.title] ? styles.expanded : ''
              } ${group.active ? styles.active : ''}`}
              onClick={() => toggleGroup(group.title)}
            >
              <span>{group.icon}</span>
              <span>{group.title}</span>
              {group.badge && <span className={styles.newBadge}>{group.badge}</span>}
              <span className={styles.expandIcon}>▼</span>
            </div>
            
            {expandedGroups[group.title] && group.items.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`${styles.adminNavItem} ${styles.adminNavSubitem} ${
                  isItemActive(item.href) ? styles.active : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function SuperAdminSidebar(props: SuperAdminSidebarProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SidebarContent {...props} />
    </Suspense>
  );
}