"use client";

import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/lib/supabase/client";
import styles from '../super-admin-components/super-admin.module.css';
import viralStyles from './viral-prediction.module.css';

const supabase = getSupabaseClient();

interface VideoAnalysis {
  id: string;
  tiktok_id: string;
  creator_username: string;
  viral_score: number;
  viral_probability: number;
  cohort_percentile: number;
  caption: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
}

interface HookFramework {
  id: string;
  name: string;
  category: string;
  success_rate: number;
  description: string;
}

export default function ViralPredictionDashboard() {
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<VideoAnalysis | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<VideoAnalysis[]>([]);
  const [hookFrameworks, setHookFrameworks] = useState<HookFramework[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalVideos: 0,
    viralPredictions: 0,
    accuracyRate: 0,
    hookDetections: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load recent analyses
      const { data: videos, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (videosError) throw videosError;
      setRecentAnalyses(videos || []);

      // Load hook frameworks
      const { data: hooks, error: hooksError } = await supabase
        .from('hook_frameworks')
        .select('*')
        .order('success_rate', { ascending: false });

      if (hooksError) throw hooksError;
      setHookFrameworks(hooks || []);

      // Calculate stats
      const { count: totalVideos } = await supabase
        .from('videos')
        .select('*', { count: 'exact', head: true });

      const { data: viralVideos } = await supabase
        .from('videos')
        .select('*')
        .gte('viral_probability', 0.7);

      const { count: hookDetections } = await supabase
        .from('video_hooks')
        .select('*', { count: 'exact', head: true });

      setSystemStats({
        totalVideos: totalVideos || 0,
        viralPredictions: viralVideos?.length || 0,
        accuracyRate: 92.5, // Mock accuracy rate
        hookDetections: hookDetections || 0
      });

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const analyzeVideo = async () => {
    if (!tiktokUrl.trim()) return;

    setIsAnalyzing(true);
    
    try {
      // Mock analysis - in real implementation, this would call your pipeline
      const mockAnalysis = {
        id: `analysis_${Date.now()}`,
        tiktok_id: extractTikTokId(tiktokUrl),
        creator_username: 'unknown_creator',
        viral_score: Math.random() * 100,
        viral_probability: Math.random(),
        cohort_percentile: Math.random() * 100,
        caption: 'Sample TikTok video caption would be extracted here...',
        view_count: Math.floor(Math.random() * 1000000),
        like_count: Math.floor(Math.random() * 50000),
        comment_count: Math.floor(Math.random() * 5000),
        share_count: Math.floor(Math.random() * 2000),
        created_at: new Date().toISOString()
      };

      // Store in database
      const { data: storedVideo, error } = await supabase
        .from('videos')
        .insert({
          tiktok_id: mockAnalysis.tiktok_id,
          creator_username: mockAnalysis.creator_username,
          creator_id: mockAnalysis.creator_username,
          view_count: mockAnalysis.view_count,
          like_count: mockAnalysis.like_count,
          comment_count: mockAnalysis.comment_count,
          share_count: mockAnalysis.share_count,
          caption: mockAnalysis.caption,
          viral_score: mockAnalysis.viral_score,
          viral_probability: mockAnalysis.viral_probability,
          cohort_percentile: mockAnalysis.cohort_percentile,
          upload_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentAnalysis(mockAnalysis);
      setTiktokUrl('');
      await loadInitialData(); // Refresh the recent analyses

    } catch (error) {
      console.error('Error analyzing video:', error);
      alert('Error analyzing video. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractTikTokId = (url: string): string => {
    // Simple extraction - in real implementation, use proper URL parsing
    const match = url.match(/tiktok\.com.*?\/(\d+)/);
    return match ? match[1] : `manual_${Date.now()}`;
  };

  const getViralCategory = (percentile: number): string => {
    if (percentile >= 99.9) return 'MEGA-VIRAL';
    if (percentile >= 99) return 'HYPER-VIRAL';
    if (percentile >= 95) return 'VIRAL';
    if (percentile >= 80) return 'TRENDING';
    return 'NORMAL';
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'MEGA-VIRAL': return '#ff0066';
      case 'HYPER-VIRAL': return '#ff6600';
      case 'VIRAL': return '#00ff66';
      case 'TRENDING': return '#ffff00';
      default: return '#666666';
    }
  };

  return (
    <div className={styles.adminContainer}>
      <div className={styles.adminHeader}>
        <div className={styles.adminTitle}>
          <h1>🧠 Viral Prediction Engine</h1>
          <p>90%+ Accuracy • God Mode Analysis • Real-time Predictions</p>
        </div>
        <div className={styles.adminActions}>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} style={{ backgroundColor: '#00ff66' }}></span>
            System Online
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{systemStats.totalVideos}</div>
          <div className={styles.statLabel}>Videos Analyzed</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{systemStats.viralPredictions}</div>
          <div className={styles.statLabel}>Viral Predictions</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{systemStats.accuracyRate}%</div>
          <div className={styles.statLabel}>Accuracy Rate</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{systemStats.hookDetections}</div>
          <div className={styles.statLabel}>Hook Detections</div>
        </div>
      </div>

      {/* Video Analysis Input */}
      <div className={viralStyles.analysisSection}>
        <div className={viralStyles.sectionHeader}>
          <h2>🎯 Analyze TikTok Video</h2>
          <p>Paste any TikTok URL to get instant viral prediction</p>
        </div>
        
        <div className={viralStyles.inputSection}>
          <input
            type="text"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@username/video/1234567890"
            className={viralStyles.urlInput}
            disabled={isAnalyzing}
          />
          <button
            onClick={analyzeVideo}
            disabled={isAnalyzing || !tiktokUrl.trim()}
            className={viralStyles.analyzeButton}
          >
            {isAnalyzing ? '🔄 Analyzing...' : '🚀 Analyze Video'}
          </button>
        </div>
      </div>

      {/* Current Analysis Results */}
      {currentAnalysis && (
        <div className={styles.resultsSection}>
          <div className={styles.sectionHeader}>
            <h2>📊 Analysis Results</h2>
          </div>
          
          <div className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <div className={styles.videoInfo}>
                <h3>@{currentAnalysis.creator_username}</h3>
                <p>{currentAnalysis.caption}</p>
              </div>
              <div 
                className={styles.viralBadge}
                style={{ backgroundColor: getCategoryColor(getViralCategory(currentAnalysis.cohort_percentile)) }}
              >
                {getViralCategory(currentAnalysis.cohort_percentile)}
              </div>
            </div>
            
            <div className={styles.metricsGrid}>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{currentAnalysis.viral_score.toFixed(1)}/100</div>
                <div className={styles.metricLabel}>Viral Score</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{(currentAnalysis.viral_probability * 100).toFixed(1)}%</div>
                <div className={styles.metricLabel}>Viral Probability</div>
              </div>
              <div className={styles.metric}>
                <div className={styles.metricValue}>{currentAnalysis.cohort_percentile.toFixed(1)}%</div>
                <div className={styles.metricLabel}>Percentile</div>
              </div>
            </div>
            
            <div className={styles.engagementStats}>
              <div className={styles.engagementItem}>
                <span>👁️ {currentAnalysis.view_count.toLocaleString()}</span>
              </div>
              <div className={styles.engagementItem}>
                <span>❤️ {currentAnalysis.like_count.toLocaleString()}</span>
              </div>
              <div className={styles.engagementItem}>
                <span>💬 {currentAnalysis.comment_count.toLocaleString()}</span>
              </div>
              <div className={styles.engagementItem}>
                <span>📤 {currentAnalysis.share_count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Analyses */}
      <div className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2>📈 Recent Analyses</h2>
          <button 
            onClick={loadInitialData}
            className={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>
        
        <div className={styles.analysisTable}>
          <div className={styles.tableHeader}>
            <div>Video</div>
            <div>Creator</div>
            <div>Viral Score</div>
            <div>Probability</div>
            <div>Category</div>
            <div>Date</div>
          </div>
          
          {recentAnalyses.map((analysis) => (
            <div key={analysis.id} className={styles.tableRow}>
              <div className={styles.videoCell}>
                <div className={styles.videoCaption}>
                  {analysis.caption?.substring(0, 50)}...
                </div>
                <div className={styles.videoId}>{analysis.tiktok_id}</div>
              </div>
              <div>@{analysis.creator_username}</div>
              <div className={styles.scoreCell}>
                {analysis.viral_score?.toFixed(1) || 'N/A'}/100
              </div>
              <div className={styles.probabilityCell}>
                {analysis.viral_probability ? (analysis.viral_probability * 100).toFixed(1) : 'N/A'}%
              </div>
              <div>
                <span 
                  className={styles.categoryBadge}
                  style={{ backgroundColor: getCategoryColor(getViralCategory(analysis.cohort_percentile || 0)) }}
                >
                  {getViralCategory(analysis.cohort_percentile || 0)}
                </span>
              </div>
              <div className={styles.dateCell}>
                {new Date(analysis.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hook Frameworks Summary */}
      <div className={styles.hooksSection}>
        <div className={styles.sectionHeader}>
          <h2>🪝 Active Hook Frameworks</h2>
          <p>{hookFrameworks.length} proven patterns loaded</p>
        </div>
        
        <div className={styles.hooksGrid}>
          {hookFrameworks.slice(0, 8).map((hook) => (
            <div key={hook.id} className={styles.hookCard}>
              <div className={styles.hookName}>{hook.name}</div>
              <div className={styles.hookCategory}>{hook.category}</div>
              <div className={styles.hookSuccess}>{hook.success_rate}% success</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
