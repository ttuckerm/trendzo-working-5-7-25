"use client";

import styles from './super-admin.module.css';

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function ExpertInputLogs() {
  const logs: LogEntry[] = [
    {
      timestamp: "2 minutes ago",
      message: 'Expert adjusted trend confidence for "POV Comedy" from 72% to 85%'
    },
    {
      timestamp: "15 minutes ago",
      message: 'Manual promotion of emerging sound trend: "Nostalgic 2010s Remix"'
    },
    {
      timestamp: "1 hour ago",
      message: 'Expert annotation added to Hook Framework: "3-second rule effectiveness"'
    },
    {
      timestamp: "3 hours ago",
      message: 'Template category refinement: Split "Comedy" into 5 sub-categories'
    }
  ];

  return (
    <div className={styles.controlPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelIcon}>✏️</div>
          <span>Recent Expert Inputs</span>
        </div>
      </div>
      <div>
        {logs.map((log, index) => (
          <div key={index} className={styles.logEntry}>
            <div className={styles.logTimestamp}>{log.timestamp}</div>
            <div>{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}