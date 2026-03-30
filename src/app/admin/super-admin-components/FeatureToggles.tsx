"use client";

import { useState } from 'react';
import styles from './super-admin.module.css';

interface Feature {
  name: string;
  active: boolean;
}

export default function FeatureToggles() {
  const [features, setFeatures] = useState<Feature[]>([
    { name: "Neural Style Transfer", active: true },
    { name: "AI Trend Psychic", active: true },
    { name: "Time Machine Mode", active: false },
    { name: "Haptic Feedback", active: false },
    { name: "JARVIS for Enterprise", active: true }
  ]);

  const toggleFeature = (index: number) => {
    setFeatures(prev => prev.map((feature, i) => 
      i === index ? { ...feature, active: !feature.active } : feature
    ));
  };

  return (
    <div className={styles.controlPanel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <div className={styles.panelIcon}>⚡</div>
          <span>Feature Toggles</span>
        </div>
      </div>
      <div className={styles.featureGrid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureToggle}>
            <span>{feature.name}</span>
            <div
              className={`${styles.toggleSwitch} ${feature.active ? styles.active : ''}`}
              onClick={() => toggleFeature(index)}
            >
              <div className={styles.toggleKnob}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}