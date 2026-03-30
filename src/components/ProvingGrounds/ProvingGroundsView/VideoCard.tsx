import React from 'react';
import { VideoData } from '../types';
import styles from './ProvingGroundsView.module.css';

const VideoCard: React.FC<{ video: VideoData }> = ({ video }) => {
  return (
    <div className={styles.videoCard}>
      <div className={styles.videoThumbnail}>
        <div className={styles.videoPlaceholder}>
          Video content analysis in progress...
        </div>
        {video.processing && (
          <div className={styles.processingIndicator}>%</div>
        )}
      </div>
      <div className={styles.videoContent}>
        <h3 className={styles.videoTitle}>{video.title}</h3>
        <p className={styles.videoCreator}>{video.creator}</p>
        <div className={styles.videoStats}>
          <div className={styles.statGroup}>
            <span className={styles.stat}>👁️ {video.views}</span>
            <span className={styles.stat}>❤️ {video.likes}</span>
          </div>
          <div className={styles.statGroup}>
            <span className={styles.stat}>💬 {video.comments}</span>
            <span className={styles.stat}>📤 {video.shares}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard; 