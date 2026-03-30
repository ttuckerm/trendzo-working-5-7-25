"use client";

import styles from './super-admin.module.css';

interface Algorithm {
  name: string;
  score: string;
  isWarning?: boolean;
}

export default function AlgorithmPerformance() {
  const algorithms: Algorithm[] = [
    { name: "Trend Prediction", score: "92% accurate" },
    { name: "Style DNA Matching", score: "88% satisfaction" },
    { name: "Hook Analysis", score: "76% accurate", isWarning: true },
    { name: "Sound Trend Detection", score: "94% early detection" }
  ];

  return (
    <div className={styles.controlPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelIcon}>🔮</div>
          <span>Algorithm Performance</span>
        </div>
      </div>
      <div>
        {algorithms.map((algo, index) => (
          <div key={index} className={styles.algorithmMetric}>
            <span className={styles.algorithmName}>{algo.name}</span>
            <span className={`${styles.algorithmScore} ${algo.isWarning ? styles.warning : ''}`}>
              {algo.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}