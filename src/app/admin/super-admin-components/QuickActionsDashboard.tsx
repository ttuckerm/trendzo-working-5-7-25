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
      icon: "🚨",
      label: "Critical Alerts",
      gradient: "linear-gradient(135deg, rgba(255, 0, 0, 0.1), rgba(255, 107, 107, 0.1))",
      action: () => router.push('/admin/system')
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