"use client";

import { useEffect, useState } from 'react';
import styles from './super-admin.module.css';

interface Metric {
  value: string;
  label: string;
  color?: 'green' | 'warning';
}

interface RealData {
  videosScraped: number;
  videosProcessed: number;
  accuracy: number;
  apifyRuns: number;
}

export default function SuperAdminHeader() {
  const [realData, setRealData] = useState<RealData>({
    videosScraped: 0,
    videosProcessed: 0,
    accuracy: 0,
    apifyRuns: 0
  });

  const [metrics, setMetrics] = useState<Metric[]>([
    { value: '0', label: 'Videos Scraped', color: 'green' },
    { value: '0', label: 'Videos Processed', color: 'green' },
    { value: '0%', label: 'Prediction Accuracy', color: 'green' },
    { value: '0', label: 'Apify Runs', color: 'warning' }
  ]);

  // Fetch REAL data from your viral prediction system
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const [pipelineRes, accuracyRes] = await Promise.all([
          fetch('/api/admin/viral-prediction/pipeline-status'),
          fetch('/api/admin/viral-prediction/accuracy-validation-real')
        ]);

        const [pipelineData, accuracyData] = await Promise.all([
          pipelineRes.json(),
          accuracyRes.json()
        ]);

        const newRealData = {
          videosScraped: pipelineData?.evidence?.processingEvidence?.videosScraped || 0,
          videosProcessed: pipelineData?.evidence?.processingEvidence?.videosProcessed || 0,
          accuracy: accuracyData?.accuracy?.overall?.accuracyRate || 0,
          apifyRuns: pipelineData?.evidence?.processingEvidence?.apifyRuns || 0
        };

        setRealData(newRealData);
        setMetrics([
          { value: newRealData.videosScraped.toString(), label: 'Videos Scraped', color: 'green' },
          { value: newRealData.videosProcessed.toString(), label: 'Videos Processed', color: 'green' },
          { value: `${newRealData.accuracy.toFixed(1)}%`, label: 'Prediction Accuracy', color: 'green' },
          { value: newRealData.apifyRuns.toString(), label: 'Apify Runs', color: 'warning' }
        ]);
      } catch (error) {
        console.error('Failed to fetch real data for header:', error);
      }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.adminHeader}>
      <h1>Platform Command Center</h1>
      <div className={styles.platformStatus}>
        {metrics.map((metric, index) => (
          <div key={index} className={styles.statusMetric}>
            <div className={`${styles.statusValue} ${metric.color === 'warning' ? styles.warning : ''}`}>
              {metric.value}
            </div>
            <div className={styles.statusLabel}>{metric.label}</div>
          </div>
        ))}
      </div>
    </header>
  );
}