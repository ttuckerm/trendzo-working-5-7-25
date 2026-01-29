'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    icon: "🏠",
    label: "Dashboard",
    href: "/admin/studio"
  },
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
    icon: "🔬",
    label: "Prediction Lab",
    href: "/admin/studio/lab"
  },
  {
    icon: "📊",
    label: "Analytics",
    href: "/admin/studio/analytics"
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
  },
  {
    icon: "⚙️",
    label: "Settings",
    href: "/admin/studio/settings"
  }
];

export default function NetflixSidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  const isActiveLink = (href: string) => {
    if (href === "/admin/studio") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div 
      className={`netflix-sidebar ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="netflix-logo">
        <div className="logo-icon">T</div>
        <div className={`logo-text ${isExpanded ? 'visible' : ''}`}>
          TRENDZO
        </div>
      </div>

      <nav className="netflix-nav">
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`netflix-nav-item ${isActiveLink(item.href) ? 'active' : ''}`}
          >
            <div className="nav-icon">{item.icon}</div>
            <div className={`nav-label ${isExpanded ? 'visible' : ''}`}>
              {item.label}
              {item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
          </Link>
        ))}
      </nav>

      <div className="netflix-footer">
        <div className="netflix-nav-item">
          <div className="nav-icon">👤</div>
          <div className={`nav-label ${isExpanded ? 'visible' : ''}`}>
            Admin
          </div>
        </div>
      </div>
    </div>
  );
}