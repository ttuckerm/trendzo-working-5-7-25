import React from 'react';
import styles from './FloatingActions.module.css';

const FloatingActions: React.FC = () => {
  return (
    <>
      <div className={styles.floatingMic}>
        <span className={styles.micIcon}>🎤</span>
      </div>
      <div className={styles.floatingAiBrain}>
        <span className={styles.brainIcon}>🧠</span>
      </div>
    </>
  );
};

export default FloatingActions; 