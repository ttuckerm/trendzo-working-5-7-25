import React from 'react';
import { ModuleData } from '../types';
import styles from './SystemAnalytics.module.css';
import ModuleCard from './ModuleCard';

const SystemAnalytics: React.FC = () => {
  const overviewData = [
    { value: '1,142,757', label: 'Total Processed' },
    { value: 10, label: 'Healthy', className: 'healthy' },
    { value: 1, label: 'Warning', className: 'warning' },
    { value: 0, label: 'Critical', className: 'critical' },
  ];

  const modules: ModuleData[] = [
    { name: 'Dashboard Aggregator', processed: 24891, uptime: 100, status: 'healthy' },
    { name: 'Draft Video Analyzer', processed: 156, uptime: 85, status: 'warning' },
    { name: 'Marketing Content Creator', processed: 89, uptime: 100, status: 'healthy' },
    { name: 'Performance Validator', processed: 22344, uptime: 100, status: 'healthy' },
    { name: 'Prediction Engine', processed: 24891, uptime: 100, status: 'healthy' },
    { name: 'Recipe Book Generator', processed: 365, uptime: 100, status: 'healthy' },
    { name: 'Script Intelligence Module', processed: 18993, uptime: 100, status: 'healthy' },
    { name: 'System Health Monitor', processed: 999999, uptime: 100, status: 'healthy' },
    { name: 'Template Discovery Engine', processed: 1247, uptime: 100, status: 'healthy' },
    { name: 'TikTok Scraper', processed: 24891, uptime: 100, status: 'healthy' },
    { name: 'Viral Pattern Analyzer', processed: 24891, uptime: 100, status: 'healthy' },
  ];

  return (
    // The <section> and header elements are removed, as they are now handled by the parent.
    <>
      <div className={styles.systemOverview}>
        {overviewData.map((item, index) => (
          <div key={index} className={styles.overviewCard}>
            <div className={`${styles.overviewNumber} ${styles[item.className || '']}`}>
              {item.value}
            </div>
            <div className={styles.overviewLabel}>{item.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.modulesGrid}>
        {modules.map((module, index) => (
          <ModuleCard key={index} module={module} />
        ))}
      </div>
    </>
  );
};

export default SystemAnalytics; 