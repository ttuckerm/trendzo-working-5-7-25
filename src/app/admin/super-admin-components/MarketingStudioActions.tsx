"use client";

import { useRouter } from 'next/navigation';
import styles from './super-admin.module.css';

interface MagicAction {
  icon: string;
  title: string;
  description: string;
  gradient: string;
  href: string;
}

export default function MarketingStudioActions() {
  const router = useRouter();

  const magicActions: MagicAction[] = [
    {
      icon: "✨",
      title: "Copy Viral Winner",
      description: "Auto-fill from 1M+ view video",
      gradient: "linear-gradient(135deg, #a855f7, #ec4899)",
      href: "/admin/marketing-studio"
    },
    {
      icon: "🔥",
      title: "Optimize for Viral",
      description: "AI-powered improvements",
      gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)",
      href: "/admin/marketing-studio"
    },
    {
      icon: "🎯",
      title: "Platform Optimize",
      description: "Multi-platform magic",
      gradient: "linear-gradient(135deg, #10b981, #84cc16)",
      href: "/admin/marketing-studio"
    }
  ];

  return (
    <div className={`${styles.controlPanel} ${styles.fullWidth}`}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelIcon}>🎯</div>
          <span>Marketing Studio - Magic Actions</span>
        </div>
      </div>
      <div className={styles.magicActionsGrid}>
        {magicActions.map((action, index) => (
          <div
            key={index}
            className={styles.magicActionCard}
            style={{ background: action.gradient }}
            onClick={() => router.push(action.href)}
          >
            <div className={styles.magicIcon}>{action.icon}</div>
            <h3 className={styles.magicTitle}>{action.title}</h3>
            <p className={styles.magicDescription}>{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}