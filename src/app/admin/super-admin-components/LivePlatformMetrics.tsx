"use client";

import { useState, useEffect } from 'react';
import styles from './super-admin.module.css';

interface Metric {
  value: string;
  label: string;
  change: string;
  isPositive: boolean;
}

export default function LivePlatformMetrics() {
  const [metrics, setMetrics] = useState<Metric[]>([
    { value: "12.5M", label: "Total Views", change: "↑ 23%", isPositive: true },
    { value: "45.2K", label: "Conversions", change: "↑ 18%", isPositive: true },
    { value: "385%", label: "Avg ROI", change: "↑ 42%", isPositive: true },
    { value: "94/100", label: "Viral Score", change: "Top 1%", isPositive: true }
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map((metric, index) => {
        if (index === 0) { // Total Views
          const current = parseFloat(metric.value);
          const change = (Math.random() * 0.2 - 0.1);
          const newValue = (current + change).toFixed(1) + 'M';
          return { ...metric, value: newValue };
        }
        if (index === 1) { // Conversions
          const current = parseFloat(metric.value);
          const change = (Math.random() * 2 - 1);
          const newValue = (current + change).toFixed(1) + 'K';
          return { ...metric, value: newValue };
        }
        return metric;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.controlPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelIcon}>📊</div>
          <span>Live Platform Metrics</span>
        </div>
      </div>
      <div className={styles.metricsGrid}>
        {metrics.map((metric, index) => (
          <div key={index} className={styles.metricBox}>
            <div className={styles.metricNumber}>{metric.value}</div>
            <div className={styles.statusLabel}>{metric.label}</div>
            <div className={`${styles.metricChange} ${!metric.isPositive ? styles.down : ''}`}>
              {metric.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}