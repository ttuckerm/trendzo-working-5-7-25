import React, { useState } from 'react';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { icon: '🏠', text: 'Dashboard', active: false },
    { icon: '🧠', text: 'AI Brain', active: false },
    { icon: '🔬', text: 'Proving Grounds', active: true },
    { icon: '🎯', text: 'Operations', active: false },
    { icon: '📊', text: 'Analytics', active: false },
    { icon: '⚙️', text: 'Settings', active: false },
  ];

  return (
    <nav 
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={styles.logo}>TZ</div>
      {navItems.map((item, index) => (
        <a key={index} className={`${styles.navItem} ${item.active ? styles.active : ''}`}>
          <span className={styles.navIcon}>{item.icon}</span>
          <span className={styles.navText}>{item.text}</span>
        </a>
      ))}
    </nav>
  );
};

export default Sidebar; 