'use client';

import React, { useState, useEffect } from 'react';
import { VideoData } from '../page';
import styles from '../ViralLabV2.module.css';

interface DiscoveryPhaseProps {
  selectedNiche: string;
  onVideoSelect: (video: VideoData) => void;
  isLoading: boolean;
  seriesMode: boolean;
  onSeriesModeToggle: (enabled: boolean) => void;
}

// Mock viral videos data by niche (would come from API)
const NICHE_VIDEOS: Record<string, VideoData[]> = {
  'Personal Finance/Investing': [
    {
      id: 'pf1',
      title: 'Investment Strategy That Changed Everything',
      views: '2.1M',
      likes: '189K',
      comments: '9.2K',
      retention: '91%',
      viralScore: 89,
      framework: 'Authority Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'pf2',
      title: 'POV: You Start Investing at 25',
      views: '3.4M',
      likes: '312K',
      comments: '15.4K',
      retention: '96%',
      viralScore: 92,
      framework: 'POV Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'pf3',
      title: '3 Money Mistakes I Made in My 20s',
      views: '1.8M',
      likes: '156K',
      comments: '8.1K',
      retention: '88%',
      viralScore: 85,
      framework: 'Story Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'pf4',
      title: 'How I Built $100K Portfolio',
      views: '2.7M',
      likes: '234K',
      comments: '11.8K',
      retention: '93%',
      viralScore: 88,
      framework: 'Tutorial Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'pf5',
      title: 'Rich vs Poor Mindset',
      views: '4.2M',
      likes: '398K',
      comments: '18.9K',
      retention: '97%',
      viralScore: 94,
      framework: 'Comparison Framework',
      thumbnail: '/api/placeholder/300/534'
    }
  ],
  'Fitness/Weight Loss': [
    {
      id: 'fw1',
      title: 'Fitness Transformation in 30 Days',
      views: '2.3M',
      likes: '245K',
      comments: '12.8K',
      retention: '94%',
      viralScore: 89,
      framework: 'Transformation Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'fw2',
      title: 'POV: You Start Working Out Consistently',
      views: '1.9M',
      likes: '178K',
      comments: '9.3K',
      retention: '91%',
      viralScore: 86,
      framework: 'POV Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'fw3',
      title: 'Quick Home Workout (No Equipment)',
      views: '3.1M',
      likes: '289K',
      comments: '14.2K',
      retention: '95%',
      viralScore: 91,
      framework: 'Tutorial Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'fw4',
      title: 'Gym Mistakes Everyone Makes',
      views: '1.6M',
      likes: '142K',
      comments: '7.8K',
      retention: '89%',
      viralScore: 83,
      framework: 'Educational Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'fw5',
      title: 'Day in Life: Fitness Coach',
      views: '2.8M',
      likes: '256K',
      comments: '13.1K',
      retention: '93%',
      viralScore: 90,
      framework: 'Day-in-Life Framework',
      thumbnail: '/api/placeholder/300/534'
    }
  ],
  'Business/Entrepreneurship': [
    {
      id: 'be1',
      title: 'Business Hack Nobody Talks About',
      views: '3.1M',
      likes: '312K',
      comments: '15.4K',
      retention: '96%',
      viralScore: 92,
      framework: 'Secret Knowledge Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'be2',
      title: 'How I Built $1M Business',
      views: '2.5M',
      likes: '223K',
      comments: '11.7K',
      retention: '92%',
      viralScore: 88,
      framework: 'Success Story Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'be3',
      title: 'Entrepreneur Morning Routine',
      views: '1.7M',
      likes: '154K',
      comments: '8.2K',
      retention: '88%',
      viralScore: 84,
      framework: 'Day-in-Life Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'be4',
      title: 'Startup Mistakes That Kill Companies',
      views: '2.2M',
      likes: '198K',
      comments: '10.4K',
      retention: '90%',
      viralScore: 87,
      framework: 'Educational Framework',
      thumbnail: '/api/placeholder/300/534'
    },
    {
      id: 'be5',
      title: 'Side Hustle Ideas for 2024',
      views: '3.6M',
      likes: '334K',
      comments: '16.8K',
      retention: '97%',
      viralScore: 93,
      framework: 'List Framework',
      thumbnail: '/api/placeholder/300/534'
    }
  ]
};

// Default fallback videos if niche not found
const DEFAULT_VIDEOS: VideoData[] = [
  {
    id: 'default1',
    title: 'Viral Content Creation Tips',
    views: '2.1M',
    likes: '189K',
    comments: '9.2K',
    retention: '91%',
    viralScore: 85,
    framework: 'Tutorial Framework',
    thumbnail: '/api/placeholder/300/534'
  },
  {
    id: 'default2',
    title: 'POV: You Finally Go Viral',
    views: '1.8M',
    likes: '167K',
    comments: '8.5K',
    retention: '88%',
    viralScore: 83,
    framework: 'POV Framework',
    thumbnail: '/api/placeholder/300/534'
  }
];

// Future Viral Vault - trending predictions
const FUTURE_VIRAL_TRENDS = [
  {
    id: 'f1',
    topic: 'POV format exploding in fitness niche',
    daysOut: 3,
    viralPotential: 94,
    currentMomentum: '+340%',
    action: 'Create POV fitness content now'
  },
  {
    id: 'f2', 
    topic: 'Day-in-life videos trending',
    daysOut: 7,
    viralPotential: 87,
    currentMomentum: '+240%',
    action: 'Prepare day-in-life content'
  },
  {
    id: 'f3',
    topic: 'Quick tips format viral in business',
    daysOut: 14,
    viralPotential: 82,
    currentMomentum: '+180%',
    action: 'Plan business tip series'
  }
];

// One-click templates
const QUICK_TEMPLATES = [
  { id: 't1', name: 'Authority Hook', time: '30 sec', icon: '🎯' },
  { id: 't2', name: 'POV Story', time: '45 sec', icon: '📱' },
  { id: 't3', name: 'Challenge Loop', time: '60 sec', icon: '🔥' },
  { id: 't4', name: 'Quick Tips', time: '20 sec', icon: '💡' },
  { id: 't5', name: 'Myth Buster', time: '40 sec', icon: '📊' },
  { id: 't6', name: 'Transform', time: '50 sec', icon: '✨' }
];

export default function DiscoveryPhase({
  selectedNiche,
  onVideoSelect,
  isLoading,
  seriesMode,
  onSeriesModeToggle
}: DiscoveryPhaseProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState('trending');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

  // Get videos for selected niche
  const nicheVideos = NICHE_VIDEOS[selectedNiche] || DEFAULT_VIDEOS;
  const currentVideo = nicheVideos[currentVideoIndex];

  const handleVideoSelection = (video: VideoData) => {
    setSelectedVideo(video);
    onVideoSelect(video);
  };

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % nicheVideos.length);
  };

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + nicheVideos.length) % nicheVideos.length);
  };

  return (
    <div className={styles.panelContainer}>
      {/* LEFT PANEL: Viral Gallery + Future Trends */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Viral Gallery + Future Vault</h3>
          <p className={styles.panelSubtitle}>Swipe to explore trending + future viral content</p>
        </div>
        
        <div className={styles.panelContent}>
          {/* Future Viral Vault Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              marginBottom: '16px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#ff9500'
            }}>
              <span>🔮</span>
              <span>Future Viral Vault (14-Day Predictions)</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FUTURE_VIRAL_TRENDS.map((trend) => (
                <div 
                  key={trend.id}
                  style={{
                    background: 'rgba(255, 149, 0, 0.1)',
                    border: '1px solid rgba(255, 149, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 149, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 149, 0, 0.1)';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '4px'
                  }}>
                    <span style={{ fontWeight: '600', color: '#ffffff' }}>{trend.topic}</span>
                    <span style={{ 
                      background: '#ff9500',
                      color: '#ffffff',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}>
                      {trend.daysOut}d
                    </span>
                  </div>
                  <div style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {trend.viralPotential}% potential • {trend.currentMomentum} momentum
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Filters */}
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '20px', 
            flexWrap: 'wrap' 
          }}>
            {['trending', 'niche', 'viral', 'rising'].map((filter) => (
              <div
                key={filter}
                onClick={() => setActiveFilter(filter)}
                style={{
                  padding: '6px 12px',
                  background: activeFilter === filter 
                    ? 'linear-gradient(135deg, #8b5cf6 0%, #448aff 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </div>
            ))}
          </div>
          
          {/* Video Card Stack */}
          <div style={{ 
            position: 'relative', 
            height: '400px', 
            marginBottom: '16px' 
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              overflow: 'hidden',
              position: 'relative',
              height: '100%'
            }}>
              {/* Video Thumbnail Area */}
              <div style={{
                height: '60%',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#ff9500',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>🔥</span>
                  <span>Trending Now</span>
                </div>
                
                <div style={{ 
                  fontSize: '48px',
                  opacity: 0.3
                }}>
                  🎬
                </div>
              </div>

              {/* Video Metrics */}
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '4px'
                  }}>
                    {currentVideo.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginBottom: '8px'
                  }}>
                    Framework: {currentVideo.framework}
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👁</span>
                    <span>{currentVideo.views} views</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>❤️</span>
                    <span>{currentVideo.likes} likes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💬</span>
                    <span>{currentVideo.comments} comments</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📈</span>
                    <span>{currentVideo.retention} retention</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Dots */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '8px', 
            marginBottom: '20px' 
          }}>
            {nicheVideos.map((_, index) => (
              <div
                key={index}
                onClick={() => setCurrentVideoIndex(index)}
                style={{
                  width: index === currentVideoIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: index === currentVideoIndex 
                    ? '#8b5cf6' 
                    : 'rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Quick Actions + Series Mode */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Quick Actions + Series Creator</h3>
          <p className={styles.panelSubtitle}>Get viral in 60 seconds or create series</p>
        </div>
        
        <div className={styles.panelContent}>
          {/* Series Mode Toggle */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                <span>📺</span>
                <span>Series Creation Mode</span>
              </div>
              
              <div
                onClick={() => onSeriesModeToggle(!seriesMode)}
                style={{
                  width: '44px',
                  height: '24px',
                  background: seriesMode ? '#8b5cf6' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{
                  position: 'absolute',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'white',
                  top: '2px',
                  left: seriesMode ? '22px' : '2px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
            </div>
            <div style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              {seriesMode 
                ? 'Create 5-part series from selected video'
                : 'Create single video from selected template'
              }
            </div>
          </div>

          {/* One-Click Templates */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                <span>⚡</span>
                <span>One-Click Templates</span>
              </div>
              <div style={{
                background: '#e50914',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                Expires in 3:47
              </div>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              {QUICK_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = '#8b5cf6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                    {template.icon}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    marginBottom: '4px' 
                  }}>
                    {template.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: 'rgba(255, 255, 255, 0.7)' 
                  }}>
                    {template.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Clone Button */}
          <button
            onClick={() => handleVideoSelection(currentVideo)}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: isLoading 
                ? 'rgba(34, 197, 94, 0.5)'
                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? (
              <>
                <div className={styles.loadingSpinner} />
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>{seriesMode ? 'Create 5-Part Series' : 'Quick Clone This Video'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: Selection Preview + Performance */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Selection Preview</h3>
          <p className={styles.panelSubtitle}>Selected video performance</p>
        </div>
        
        <div className={styles.panelContent}>
          {/* Video Preview */}
          <div style={{
            aspectRatio: '9/16',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            borderRadius: '8px',
            marginBottom: '20px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
              padding: '16px'
            }}>
              <div style={{ 
                color: '#ffffff',
                fontSize: '12px'
              }}>
                Duration: 0:28 • Framework: {currentVideo.framework}
              </div>
            </div>
            
            <div style={{ 
              fontSize: '64px',
              opacity: 0.3
            }}>
              🎬
            </div>
          </div>
          
          {/* Performance Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {currentVideo.views}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px'
              }}>
                Views
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {currentVideo.retention}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px'
              }}>
                Retention
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                10.6%
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px'
              }}>
                Engagement
              </div>
            </div>
            
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#8b5cf6'
              }}>
                {currentVideo.viralScore}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '4px'
              }}>
                Viral Score
              </div>
            </div>
          </div>
          
          {/* Push Notifications Toggle */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ 
                fontWeight: '600',
                fontSize: '13px',
                marginBottom: '2px'
              }}>
                Push Notifications
              </div>
              <div style={{ 
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Get alerts for similar trends
              </div>
            </div>
            
            <div style={{
              width: '44px',
              height: '24px',
              background: '#8b5cf6',
              borderRadius: '12px',
              position: 'relative',
              cursor: 'pointer'
            }}>
              <div style={{
                position: 'absolute',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'white',
                top: '2px',
                left: '22px',
                transition: 'all 0.3s ease'
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 