import React from 'react';
import styles from './DiscoveryEngine.module.css';

const DiscoveryEngine: React.FC = () => {
  return (
    // The <section> and header elements are removed, as they are now handled by the parent.
    <div className={styles.discoveryCard}>
      <div className={styles.discoveryHeader}>
        <span className={styles.discoveryIcon}>🔬</span>
        <h3 className={styles.discoveryTitle}>Template Discovery Engine</h3>
      </div>
      <p className={styles.discoveryDescription}>
        Analyze viral videos to discover new patterns and templates
      </p>
      <button className={styles.discoveryButton}>
        <span>🚀</span>
        <span>Run Template Discovery</span>
      </button>
    </div>
  );
};

export default DiscoveryEngine; 