import React from 'react';
import styles from './Header.module.css';

const Header: React.FC = () => {
  const stats = [
    { value: 247, label: 'Predictions', className: 'predictions' },
    { value: '94.2%', label: 'Accuracy', className: 'accuracy' },
    { value: 12, label: 'Trending', className: 'trending' },
  ];

  return (
    <header className={styles.topBar}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Proving Grounds</h1>
        <p className={styles.pageSubtitle}>AI-Predicted Viral Content</p>
      </div>

      <div className={styles.headerStats}>
        {stats.map((stat, index) => (
          <div key={index} className={styles.statItem}>
            <div className={`${styles.statNumber} ${styles[stat.className]}`}>{stat.value}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={styles.searchContainer}>
        <span className={styles.searchIcon}>🔍</span>
        <input 
          type="text" 
          className={styles.searchInput} 
          placeholder="Search predictions, creators, trends..."
        />
      </div>

      <div className={styles.profileAvatar}>A</div>
    </header>
  );
};

export default Header; 