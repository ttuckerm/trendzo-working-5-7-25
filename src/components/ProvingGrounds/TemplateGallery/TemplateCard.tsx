import React, { useState } from 'react';
import { TemplateData } from '../types';
import styles from './TemplateGallery.module.css';

const TemplateCard: React.FC<{ template: TemplateData }> = ({ template }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={styles.templateTile}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.tileBackground}></div>
      <div className={styles.tileOverlay}></div>
      <div className={styles.tileGlow}></div>
      
      {isHovered && (
        <>
          <div className={styles.playOverlay}>
            <div className={styles.playButton}>
              <div className={styles.playIcon}></div>
            </div>
          </div>
          <div className={styles.tileStats}>
            <span className={styles.viralScore}>{template.score}%</span>
          </div>
        </>
      )}
      
      <div className={styles.tileContent}>
        <h4 className={styles.tileTitle}>{template.name}</h4>
        <span className={styles.tileTag}>🎭 {template.tags[0].toUpperCase()}</span>
      </div>
    </div>
  );
};

export default TemplateCard; 