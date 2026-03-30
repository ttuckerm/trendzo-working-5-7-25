import React, { useEffect, useState } from 'react';
import { VideoData } from '../types';
import styles from './ProvingGroundsView.module.css';
import VideoCard from './VideoCard';

const ProvingGroundsView: React.FC = () => {
  const [sortBy, setSortBy] = useState('most-recent');
  const [platform, setPlatform] = useState('all');
  const [videos, setVideos] = useState<VideoData[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/gallery/proving-grounds?limit=24');
        if (!res.ok) return;
        const data = await res.json();
        const mapped: VideoData[] = (data || []).map((v: any) => ({
          id: v.id,
          title: v.caption || v.title || 'Untitled',
          creator: '@Unknown Creator',
          views: formatCompact(v.stats?.views ?? 0),
          likes: formatCompact(v.stats?.likes ?? 0),
          comments: formatCompact(v.stats?.comments ?? 0),
          shares: formatCompact(v.stats?.shares ?? 0),
          processing: false,
        }));
        if (mapped.length > 0) setVideos(mapped);
      } catch (_e) {
        // keep empty on failure
      }
    };
    load();
  }, []);

  const formatCompact = (n: number): string => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  return (
    // The <section> and header elements are removed, as they are now handled by the parent.
    <>
      <div className={styles.controlsBar}>
        <div className={styles.filterControls}>
          <select
            className={styles.filterDropdown}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="most-recent">Most Recent</option>
            <option value="highest-score">Highest Score</option>
            <option value="trending">Trending</option>
          </select>
          <select
            className={styles.filterDropdown}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="all">All Platforms</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
          </select>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.btnRefresh}>🔄 Refresh</button>
          <button className={styles.btnQuickPredict}>Quick Predict</button>
        </div>
      </div>

      <div className={styles.videoGrid}>
        {videos.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>

      <div className={styles.pagination}>
        <button className={styles.paginationBtn} disabled>Previous</button>
        <span className={styles.pageInfo}>Page 1 of 1</span>
        <button className={styles.paginationBtn}>Next</button>
      </div>
    </>
  );
};

export default ProvingGroundsView; 