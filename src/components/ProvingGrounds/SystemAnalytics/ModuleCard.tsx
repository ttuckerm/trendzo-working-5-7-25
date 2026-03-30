import React from 'react';
import { ModuleData } from '../types';
import styles from './SystemAnalytics.module.css';

const ModuleCard: React.FC<{ module: ModuleData }> = ({ module }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '✓';
      case 'warning': return '⚠';
      case 'critical': return '✗';
      default: return '✓';
    }
  };
  
  const statusClassName = styles[`status${module.status.charAt(0).toUpperCase() + module.status.slice(1)}`];
  const progressClassName = styles[`progress${module.status.charAt(0).toUpperCase() + module.status.slice(1)}`];

  return (
    <div className={styles.moduleCard}>
      <div className={styles.moduleHeader}>
        <h3 className={styles.moduleName}>{module.name}</h3>
        <div className={`${styles.moduleStatus} ${statusClassName}`}>
          {getStatusIcon(module.status)}
        </div>
      </div>
      <div className={styles.moduleMetrics}>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Processed</span>
          <span className={`${styles.metricValue} ${styles.metricProcessed}`}>
            {module.processed.toLocaleString()}
          </span>
        </div>
        <div className={styles.metricItem}>
          <span className={styles.metricLabel}>Uptime</span>
          <span className={`${styles.metricValue} ${styles.metricUptime}`}>{module.uptime}%</span>
        </div>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressFill} ${progressClassName}`} 
          style={{ width: `${module.uptime}%` }}
        />
      </div>
    </div>
  );
};

export default ModuleCard; 