'use client';

import React, { useState, useEffect } from 'react';
import { VideoData, WorkspaceConfig, ViralPrediction } from '../page';
import styles from '../ViralLabV2.module.css';

interface CreationPhaseProps {
  selectedVideo: VideoData;
  workspaceConfig: WorkspaceConfig;
  userContent: {
    hook: string;
    authority: string;
    valuePoints: string[];
    visualProof: string;
    cta: string;
  };
  onContentChange: (content: any) => void;
  viralPrediction: ViralPrediction | null;
  isAnalyzing: boolean;
  activeVariation: number;
  onVariationChange: (variation: number) => void;
  seriesMode: boolean;
  creatorFingerprint: any;
}

// Video variations data
const VARIATIONS = [
  { id: 0, name: 'Version A', style: 'Authority Hook', color: '#8b5cf6' },
  { id: 1, name: 'Version B', style: 'Story Loop', color: '#448aff' },
  { id: 2, name: 'Version C', style: 'POV Format', color: '#22c55e' },
  { id: 3, name: 'Version D', style: 'Challenge', color: '#ff9500' },
  { id: 4, name: 'Version E', style: 'Tutorial', color: '#e50914' }
];

// Universal controls data
const UNIVERSAL_CONTROLS = [
  { label: 'Audio', value: 'Trending Beat #1', options: ['Trending Beat #1', 'Motivational #42', 'Viral Audio #7'] },
  { label: 'Visual Style', value: 'Dynamic Cuts', options: ['Dynamic Cuts', 'Smooth Flow', 'Quick Cuts'] },
  { label: 'Pacing', value: 'Fast (180 WPM)', options: ['Slow (120 WPM)', 'Medium (150 WPM)', 'Fast (180 WPM)'] },
  { label: 'Hook Style', value: 'Authority Gap', options: ['Authority Gap', 'Curiosity Gap', 'Problem Hook'] },
  { label: 'CTA Type', value: 'Follow + Value', options: ['Follow + Value', 'Engagement', 'Direct Action'] }
];

export default function CreationPhase({
  selectedVideo,
  workspaceConfig,
  userContent,
  onContentChange,
  viralPrediction,
  isAnalyzing,
  activeVariation,
  onVariationChange,
  seriesMode,
  creatorFingerprint
}: CreationPhaseProps) {
  const [viralScore, setViralScore] = useState(85);
  const [hookPower, setHookPower] = useState(0);
  const [selectedControl, setSelectedControl] = useState<string | null>(null);

  // Update viral score based on content
  useEffect(() => {
    let score = 50;
    Object.values(userContent).forEach(value => {
      if (typeof value === 'string' && value.trim()) score += 7;
      if (Array.isArray(value)) {
        value.forEach(v => { if (v.trim()) score += 5; });
      }
    });
    setViralScore(Math.min(score, 95));
  }, [userContent]);

  // Update hook power based on hook content
  useEffect(() => {
    if (userContent.hook) {
      const power = Math.min(userContent.hook.length * 2, 85);
      setHookPower(power);
    }
  }, [userContent.hook]);

  const handleInputChange = (field: string, value: string | string[]) => {
    const newContent = { ...userContent, [field]: value };
    onContentChange(newContent);
  };

  const quickFillAll = () => {
    const templates = {
      hook: "I helped 1000+ fitness enthusiasts transform their bodies with this simple method",
      authority: "As a certified personal trainer with 10 years of experience and a degree in sports science, I've discovered what actually works...",
      valuePoints: [
        "Focus on compound movements that target multiple muscle groups",
        "Nutrition timing is more important than perfect macros",
        "Recovery and sleep directly impact your transformation speed"
      ],
      visualProof: "Show before/after transformations and client testimonials",
      cta: "Follow for more evidence-based fitness tips that actually work"
    };
    
    handleInputChange('hook', templates.hook);
    handleInputChange('authority', templates.authority);
    handleInputChange('valuePoints', templates.valuePoints);
    handleInputChange('visualProof', templates.visualProof);
    handleInputChange('cta', templates.cta);
  };

  return (
    <div className={styles.panelContainer}>
      {/* LEFT PANEL: Reference & DNA */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Reference & DNA</h3>
          <p className={styles.panelSubtitle}>Your viral blueprint</p>
        </div>
        
        <div className={styles.panelContent}>
          {/* Reference Controls */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {['Minimize', 'Clone Section', 'Show DNA'].map((control) => (
              <button
                key={control}
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {control}
              </button>
            ))}
          </div>

          {/* Video Preview with DNA Markers */}
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
            {/* DNA Markers */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                left: '10%',
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#448aff',
                opacity: 0.5
              }} />
              <div style={{
                position: 'absolute',
                left: '40%',
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#8b5cf6',
                opacity: 0.5
              }} />
              <div style={{
                position: 'absolute',
                left: '70%',
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#8b5cf6',
                opacity: 0.5
              }} />
              <div style={{
                position: 'absolute',
                left: '90%',
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#22c55e',
                opacity: 0.5
              }} />
            </div>

            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
              padding: '16px',
              color: '#ffffff',
              fontSize: '12px'
            }}>
              Reference: {selectedVideo.views} views
            </div>
            
            <div style={{ fontSize: '64px', opacity: 0.3 }}>🎬</div>
          </div>

          {/* Retention Analysis */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '12px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Retention Analysis
            </div>
            <div style={{
              height: '80px',
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70%',
                background: 'linear-gradient(to top, rgba(68, 138, 255, 0.3), transparent)',
                clipPath: 'polygon(0% 100%, 10% 30%, 20% 35%, 30% 25%, 40% 40%, 50% 35%, 60% 45%, 70% 40%, 80% 50%, 90% 45%, 100% 60%, 100% 100%)'
              }} />
            </div>
          </div>

          {/* Structure Checklist */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Match Your Structure
            </div>
            
            {[
              { label: 'Hook (0-3s)', completed: !!userContent.hook },
              { label: 'Authority signal', completed: !!userContent.authority },
              { label: 'Value delivery', completed: userContent.valuePoints.some(v => v.trim()) },
              { label: 'Visual proof', completed: !!userContent.visualProof },
              { label: 'Clear CTA', completed: !!userContent.cta }
            ].map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 0',
                fontSize: '13px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: item.completed 
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                    : 'rgba(255, 255, 255, 0.1)',
                  color: item.completed ? 'white' : 'rgba(255, 255, 255, 0.5)'
                }}>
                  {item.completed ? '✓' : '·'}
                </div>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Value Template Editor with Variations */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            {seriesMode ? 'Series Creator' : 'Value Template Editor'}
          </h3>
          <p className={styles.panelSubtitle}>
            {seriesMode ? 'Create 5-part video series' : 'Create your viral content with real-time guidance'}
          </p>
        </div>

        {/* Variation Tabs */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '12px 20px',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {VARIATIONS.map((variation) => (
            <div
              key={variation.id}
              onClick={() => onVariationChange(variation.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                background: activeVariation === variation.id 
                  ? variation.color
                  : 'rgba(255, 255, 255, 0.05)',
                color: activeVariation === variation.id 
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.7)',
                border: `1px solid ${activeVariation === variation.id 
                  ? variation.color 
                  : 'rgba(255, 255, 255, 0.1)'}`
              }}
            >
              {variation.name}
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {variation.style}
              </div>
            </div>
          ))}
        </div>

        {/* Universal Controls */}
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '12px'
        }}>
          {UNIVERSAL_CONTROLS.map((control) => (
            <div key={control.label} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {control.label}
              </span>
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontWeight: '600' }}>{control.value}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>▼</span>
              </div>
            </div>
          ))}
        </div>

        {/* Creation Workspace */}
        <div className={styles.panelContent}>
          {/* Quick Template Bar */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(68, 138, 255, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>⚡</span>
              <span>One-click fill with trending template</span>
            </div>
            <button
              onClick={quickFillAll}
              style={{
                padding: '6px 16px',
                background: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Fill All Fields
            </button>
          </div>

          {/* Input Sections */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>1</span>
                <span>Hook & Authority Setup</span>
              </div>
              <div style={{
                background: 'rgba(68, 138, 255, 0.2)',
                color: '#448aff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                AI: Start strong
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#448aff',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Opening Hook (First 3 seconds)
              </label>
              <input
                type="text"
                value={userContent.hook}
                onChange={(e) => handleInputChange('hook', e.target.value)}
                placeholder="I helped 1000+ people achieve..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#448aff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(68, 138, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#448aff',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Authority Statement
              </label>
              <textarea
                value={userContent.authority}
                onChange={(e) => handleInputChange('authority', e.target.value)}
                placeholder="As a certified professional with 10 years..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  minHeight: '80px',
                  resize: 'vertical',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#448aff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(68, 138, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>

          {/* Value Points Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>2</span>
                <span>Value Delivery</span>
              </div>
              <div style={{
                background: 'rgba(68, 138, 255, 0.2)',
                color: '#448aff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                AI: Match structure
              </div>
            </div>

            {userContent.valuePoints.map((point, index) => (
              <div key={index} style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#448aff',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Value Point {index + 1}
                </label>
                <input
                  type="text"
                  value={point}
                  onChange={(e) => {
                    const newPoints = [...userContent.valuePoints];
                    newPoints[index] = e.target.value;
                    handleInputChange('valuePoints', newPoints);
                  }}
                  placeholder={`${index === 0 ? 'First' : index === 1 ? 'Second' : 'Third'} tip or insight...`}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#448aff';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(68, 138, 255, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            ))}
          </div>

          {/* Trust & CTA Section */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>3</span>
                <span>Trust & CTA</span>
              </div>
              <div style={{
                background: 'rgba(68, 138, 255, 0.2)',
                color: '#448aff',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                AI: Close strong
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#448aff',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Visual Proof Description
              </label>
              <input
                type="text"
                value={userContent.visualProof}
                onChange={(e) => handleInputChange('visualProof', e.target.value)}
                placeholder="Show results, testimonials, or demonstrations..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#448aff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(68, 138, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#448aff',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Call to Action
              </label>
              <input
                type="text"
                value={userContent.cta}
                onChange={(e) => handleInputChange('cta', e.target.value)}
                placeholder="Follow for more tips on..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#448aff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(68, 138, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live Predictions + Performance */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Live Predictions</h3>
          <p className={styles.panelSubtitle}>Real-time viral scoring</p>
        </div>
        
        <div className={styles.panelContent}>
          {/* Live Score Display */}
          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 16px',
              position: 'relative'
            }}>
              <svg width="120" height="120">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <circle
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                  cx="60"
                  cy="60"
                  r="54"
                />
                <circle
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  cx="60"
                  cy="60"
                  r="54"
                  strokeDasharray="339.292"
                  strokeDashoffset={339.292 - (viralScore / 100 * 339.292)}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '36px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #22c55e 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {viralScore}
              </div>
            </div>
            <div style={{
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Viral Score
            </div>
          </div>

          {/* Hook Power Meter */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                First 3 Seconds Power
              </div>
            </div>
            <div style={{
              width: '100%',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '20px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: `${hookPower}%`,
                background: 'linear-gradient(90deg, #22c55e 0%, #8b5cf6 100%)',
                borderRadius: '20px',
                transition: 'width 0.5s ease'
              }} />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white'
              }}>
                {hookPower}% Power
              </div>
            </div>
          </div>

          {/* Real-time Feedback */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Real-time Feedback
            </div>
            
            {[
              { type: 'positive', text: 'Strong pattern match with source video' },
              { type: 'warning', text: 'Add specific numbers to your hook for more impact' },
              { type: 'positive', text: 'Keep going - your structure is on track!' }
            ].map((feedback, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: feedback.type === 'positive' 
                    ? 'rgba(34, 197, 94, 0.2)' 
                    : 'rgba(255, 149, 0, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  color: feedback.type === 'positive' ? '#22c55e' : '#ff9500',
                  flexShrink: 0
                }}>
                  {feedback.type === 'positive' ? '✓' : '!'}
                </div>
                <div style={{
                  fontSize: '13px',
                  lineHeight: 1.5
                }}>
                  {feedback.text}
                </div>
              </div>
            ))}
          </div>

          {/* Launch Timing */}
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#8b5cf6'
              }}>
                <span>🚀</span>
                <span>Optimal Launch Times</span>
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
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}>
              {[
                { time: 'Today 7:00 PM', best: true },
                { time: 'Tomorrow 12:00 PM', best: false },
                { time: 'Tomorrow 7:00 PM', best: false },
                { time: 'Thursday 5:00 PM', best: false }
              ].map((slot, index) => (
                <div
                  key={index}
                  style={{
                    background: slot.best 
                      ? 'rgba(34, 197, 94, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    color: slot.best ? '#22c55e' : '#ffffff',
                    fontWeight: slot.best ? '600' : '400'
                  }}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </div>

          {/* Prediction Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
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
                {(viralScore * 25000).toLocaleString()}
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Est. Views
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
                {(viralScore * 0.15).toFixed(1)}%
              </div>
              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Est. Engagement
              </div>
            </div>
          </div>
        </div>
        
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>💾</span>
            <span>Save Draft</span>
          </button>
          
          <button
            style={{
              flex: 1,
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #e50914 0%, #ff5147 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(229, 9, 20, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span>🚀</span>
            <span>{seriesMode ? 'Launch Series' : 'Publish Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}