"use client";

import { useRouter } from 'next/navigation';
import styles from './super-admin.module.css';

interface QuickAction {
  icon: string;
  label: string;
  gradient: string;
  action: () => void;
}

export default function QuickActionsDashboard() {
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      icon: "🎬",
      label: "Create Template",
      gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))",
      action: () => router.push('/admin/studio')
    },
    {
      icon: "📊",
      label: "Today's Performance",
      gradient: "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(236, 72, 153, 0.1))",
      action: () => router.push('/admin/analytics')
    },
    {
      icon: "🔮",
      label: "Trending Now",
      gradient: "linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 146, 60, 0.1))",
      action: () => router.push('/admin/analytics')
    },
    {
      icon: "🚨",
      label: "Critical Alerts",
      gradient: "linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 107, 107, 0.1))",
      action: () => router.push('/admin/system')
    },
    {
      icon: "💰",
      label: "Revenue Pulse",
      gradient: "linear-gradient(135deg, rgba(0, 255, 0, 0.1), rgba(107, 207, 127, 0.1))",
      action: () => router.push('/admin/analytics')
    },
    {
      icon: "🧠",
      label: "AI Brain Chat",
      gradient: "linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 255, 255, 0.05))",
      action: () => router.push('/admin/ai-brain')
    },
    {
      icon: "📧",
      label: "Newsletter Blast",
      gradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
      action: () => router.push('/admin/newsletter')
    },
    {
      icon: "⚡",
      label: "Feature Toggle",
      gradient: "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
      action: () => router.push('/admin/system')
    }
  ];

  return (
    <div className={`${styles.controlPanel} ${styles.fullWidth}`}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelIcon}>⚡</div>
          <span>Quick Actions Dashboard</span>
        </div>
      </div>
      <div className={styles.quickActionsGrid}>
        {quickActions.map((action, index) => (
          <div
            key={index}
            className={styles.quickActionCard}
            style={{ background: action.gradient }}
            onClick={action.action}
          >
            <div className={styles.quickActionIcon}>{action.icon}</div>
            <div className={styles.quickActionLabel}>{action.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}