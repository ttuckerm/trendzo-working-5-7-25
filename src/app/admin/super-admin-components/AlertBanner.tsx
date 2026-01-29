"use client";

import { useState, useEffect } from 'react';
import styles from './super-admin.module.css';

export default function AlertBanner() {
  const [isActive, setIsActive] = useState(false);
  const [message, setMessage] = useState('SYSTEM ALERT: Unusual spike in template creation detected');

  useEffect(() => {
    // Simulate alert appearing after 3 seconds
    const showTimer = setTimeout(() => {
      setIsActive(true);
    }, 3000);

    // Hide alert after 8 seconds
    const hideTimer = setTimeout(() => {
      setIsActive(false);
    }, 8000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className={`${styles.alertBanner} ${isActive ? styles.active : ''}`}>
      {message}
    </div>
  );
}