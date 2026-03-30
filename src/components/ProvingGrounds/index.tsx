'use client';
import React from 'react';

// Import all the created components
import Sidebar from './Sidebar';
import Header from './Header';
import SystemAnalytics from './SystemAnalytics';
import DiscoveryEngine from './DiscoveryEngine';
import TemplateGallery from './TemplateGallery';
import ProvingGroundsView from './ProvingGroundsView';
import FloatingActions from './FloatingActions';

// Import layout and global styles
import styles from './ProvingGrounds.module.css';
import './global.css';

// Main App Component
const TrendzoProvingGrounds: React.FC = () => {
  // This wrapper function adds the shared "section" and "section-header" classes.
  // The child component's own <section> tag has been removed.
  const SectionWrapper = ({ title, emoji, children }: { title: string, emoji: string, children: React.ReactNode }) => (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{emoji} {title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className={styles.appContainer}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        <Header />
        
        <div className={styles.contentContainer}>
          <SectionWrapper title="System Analytics" emoji="📊">
            <SystemAnalytics />
          </SectionWrapper>
          
          <SectionWrapper title="Template Discovery Engine" emoji="🔬">
            <DiscoveryEngine />
          </SectionWrapper>

          <SectionWrapper title="Template Gallery" emoji="📚">
            <TemplateGallery />
          </SectionWrapper>
          
          <SectionWrapper title="Proving Grounds" emoji="🎯">
            <ProvingGroundsView />
          </SectionWrapper>
        </div>
        
        <FloatingActions />
      </div>
    </div>
  );
};

export default TrendzoProvingGrounds; 