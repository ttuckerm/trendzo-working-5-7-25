"use client";

import styles from './super-admin.module.css';

interface UserTier {
  name: string;
  count: string;
  percentage: number;
  color: string;
}

export default function UserDistribution() {
  const tiers: UserTier[] = [
    { name: "Free Tier", count: "142K users", percentage: 50, color: "#3b82f6" },
    { name: "Creator Tier", count: "98K users", percentage: 35, color: "#8b5cf6" },
    { name: "Agency Tier", count: "42K users", percentage: 14, color: "#ec4899" },
    { name: "Enterprise Tier", count: "2.1K users", percentage: 1, color: "#fbbf24" }
  ];

  return (
    <div className={styles.controlPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelIcon}>🎯</div>
          <span>User Distribution</span>
        </div>
      </div>
      <div style={{ padding: '20px' }}>
        {tiers.map((tier, index) => (
          <div key={index} className={styles.userTier}>
            <div className={styles.tierHeader}>
              <span>{tier.name}</span>
              <span>{tier.count}</span>
            </div>
            <div className={styles.tierBar}>
              <div
                className={styles.tierProgress}
                style={{
                  width: `${tier.percentage}%`,
                  background: tier.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}