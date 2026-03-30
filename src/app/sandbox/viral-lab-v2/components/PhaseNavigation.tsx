'use client';

import React, { useState } from 'react';
import styles from '../ViralLabV2.module.css';

interface PhaseNavigationProps {
  currentPhase: 1 | 2 | 3;
  selectedNiche: string;
  onPhaseChange: (phase: 1 | 2 | 3) => void;
  onNicheChange: (niche: string) => void;
  onReset: () => void;
}

const NICHES = [
  'Personal Finance/Investing',
  'Fitness/Weight Loss', 
  'Business/Entrepreneurship',
  'Food/Nutrition Comparisons',
  'Beauty/Skincare',
  'Real Estate/Property',
  'Self-Improvement/Productivity',
  'Dating/Relationships',
  'Education/Study Tips',
  'Career/Job Advice',
  'Parenting/Family',
  'Tech Reviews/Tutorials',
  'Fashion/Style',
  'Health/Medical Education',
  'Cooking/Recipes',
  'Psychology/Mental Health',
  'Travel/Lifestyle',
  'DIY/Home Improvement',
  'Language Learning',
  'Side Hustles/Making Money Online'
];

const PHASES = [
  {
    id: 1,
    title: 'Discovery',
    subtitle: 'Browse viral videos'
  },
  {
    id: 2,
    title: 'Analysis',
    subtitle: 'Detect patterns'
  },
  {
    id: 3,
    title: 'Creation',
    subtitle: 'Build your content'
  }
];

export default function PhaseNavigation({
  currentPhase,
  selectedNiche,
  onPhaseChange,
  onNicheChange,
  onReset
}: PhaseNavigationProps) {
  const [isNicheDropdownOpen, setIsNicheDropdownOpen] = useState(false);

  const handleNicheSelect = (niche: string) => {
    onNicheChange(niche);
    setIsNicheDropdownOpen(false);
    // Reset to phase 1 when niche changes
    onReset();
  };

  const handlePhaseClick = (phase: 1 | 2 | 3) => {
    // Only allow clicking on completed phases or current phase
    if (phase <= currentPhase) {
      onPhaseChange(phase);
    }
  };

  return (
    <div className={styles.phaseNavigation}>

      {/* Phase Progress */}
      <div className={styles.phaseProgress}>
        {PHASES.map((phase, index) => (
          <React.Fragment key={phase.id}>
            <div 
              className={`${styles.phaseItem} ${
                currentPhase === phase.id ? styles.active : ''
              } ${currentPhase > phase.id ? styles.completed : ''}`}
              onClick={() => handlePhaseClick(phase.id as 1 | 2 | 3)}
              style={{
                cursor: phase.id <= currentPhase ? 'pointer' : 'not-allowed',
                opacity: phase.id > currentPhase ? 0.5 : 1
              }}
            >
              <div className={styles.phaseNumber}>{phase.id}</div>
              <div className={styles.phaseContent}>
                <div className={styles.phaseTitle}>{phase.title}</div>
                <div className={styles.phaseSubtitle}>{phase.subtitle}</div>
              </div>
            </div>
            
            {index < PHASES.length - 1 && (
              <div className={`${styles.phaseConnector} ${
                currentPhase > phase.id ? styles.completed : ''
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Reset Button */}
      <button
        onClick={onReset}
        style={{
          padding: '8px 16px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '8px',
          color: '#ffffff',
          fontSize: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
        }}
      >
        Reset Workflow
      </button>
    </div>
  );
} 