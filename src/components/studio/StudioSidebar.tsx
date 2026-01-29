'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: "Studio",
    items: [
      {
        icon: "🎯",
        label: "Proving Grounds",
        href: "/admin/studio",
        badge: "LIVE"
      },
      {
        icon: "⚔️",
        label: "The Armory",
        href: "/admin/studio/armory"
      },
      {
        icon: "📊",
        label: "Analytics",
        href: "/admin/studio/analytics"
      }
    ]
  },
  {
    title: "Tools",
    items: [
      {
        icon: "🔬",
        label: "Prediction Lab",
        href: "/admin/studio/lab"
      },
      {
        icon: "🎨",
        label: "Template Builder",
        href: "/admin/studio/builder"
      },
      {
        icon: "⚡",
        label: "Quick Actions",
        href: "/admin/studio/actions"
      }
    ]
  }
];

interface StudioSidebarProps {
  collapsed?: boolean;
}

export default function StudioSidebar({ collapsed = false }: StudioSidebarProps) {
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/admin/studio") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`studio-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="studio-logo">
        <h1>TRENDZO</h1>
        {!collapsed && <div className="studio-subtitle">Studio</div>}
      </div>
      
      <nav className="studio-nav">
        {navigationSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="nav-section">
            {!collapsed && (
              <div className="nav-section-title">{section.title}</div>
            )}
            {section.items.map((item, itemIndex) => (
              <Link
                key={itemIndex}
                href={item.href}
                className={`nav-item ${isActiveLink(item.href) ? 'active' : ''}`}
              >
                <div className="icon">{item.icon}</div>
                {!collapsed && (
                  <>
                    <div className="label">{item.label}</div>
                    {item.badge && (
                      <div className="badge">{item.badge}</div>
                    )}
                  </>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </div>
  );
}