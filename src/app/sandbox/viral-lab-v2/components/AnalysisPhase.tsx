'use client';

import React, { useState, useEffect } from 'react';
import { VideoData, WorkspaceConfig } from '../page';
import styles from '../ViralLabV2.module.css';

interface AnalysisPhaseProps {
  selectedVideo: VideoData;
  workspaceConfig: WorkspaceConfig | null;
  onProceedToCreation: () => void;
  isLoading: boolean;
  creatorFingerprint: any;
  onCreatorFingerprintUpdate: (fingerprint: any) => void;
}

// Mock creator fingerprint data
const MOCK_CREATOR_FINGERPRINT = {
  creatorId: 'user123',
  totalVideos: 47,
  averageViralScore: 76,
  bestPerformingFramework: 'Authority Hook',
  engagement: {
    bestTimeToPost: 'Today 7:00 PM',
    optimalLength: '28-35 seconds',
    topEmotions: ['Inspiration', 'Curiosity', 'Excitement']
  },
  patterns: {
    successfulHooks: [
      'Personal achievement claims',
      'Expert credentials',
      'Specific numbers/results'
    ],
    preferredStyle: 'Fast-paced with visual proof',
    audienceType: 'Growth-minded individuals 25-40'
  },
  recommendations: [
    'Use numbers in hooks (87% higher engagement)',
    'Include visual demonstrations (2.3x retention)',
    'Post between 6-8 PM for max reach'
  ]
};

// Mock DNA patterns detected
const DNA_PATTERNS = [
  {
    id: 'p1',
    name: 'Hook Structure',
    confidence: 98,
    description: 'Authority gap pattern detected - Personal achievement followed by expertise claim',
    viralPotential: 'High'
  },
  {
    id: 'p2', 
    name: 'Content Flow',
    confidence: 92,
    description: '3-tip structure with visual demonstrations at key retention points',
    viralPotential: 'High'
  },
  {
    id: 'p3',
    name: 'Engagement Triggers',
    confidence: 88,
    description: 'Question-based CTA with value promise for continued engagement',
    viralPotential: 'Medium-High'
  },
  {
    id: 'p4',
    name: 'Visual Elements',
    confidence: 85,
    description: 'Dynamic cuts with proof elements strategically placed',
    viralPotential: 'Medium-High'
  }
];

// Feedback loop insights from previous videos
const FEEDBACK_INSIGHTS = [
  {
    icon: '📈',
    title: 'Retention Optimization',
    insight: 'Your last 3 videos show 15% higher retention when you use visual demonstrations',
    improvement: '15%'
  },
  {
    icon: '🎯',
    title: 'Hook Performance', 
    insight: 'Videos starting with numbers get 2.3x more engagement in your niche',
    improvement: '130%'
  },
  {
    icon: '⏰',
    title: 'Timing Analysis',
    insight: 'Your audience is most active 7-9 PM - 40% better performance',
    improvement: '40%'
  }
];

// Mock framework steps
const FRAMEWORK_STEPS = [
  { title: 'Hook with Authority', timing: '0-3s' },
  { title: 'Establish Credibility', timing: '3-8s' },
  { title: 'Deliver Value Points', timing: '8-23s' },
  { title: 'Visual Proof', timing: '23-28s' },
  { title: 'Strong CTA', timing: '28-30s' }
];

export default function AnalysisPhase({
  selectedVideo,
  workspaceConfig,
  onProceedToCreation,
  isLoading,
  creatorFingerprint,
  onCreatorFingerprintUpdate
}: AnalysisPhaseProps) {
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const analysisSteps = [
    { icon: '🧬', label: 'Extracting DNA patterns...', duration: 1000 },
    { icon: '🎯', label: 'Analyzing viral elements...', duration: 800 },
    { icon: '📊', label: 'Building creator profile...', duration: 1200 },
    { icon: '✨', label: 'Generating recommendations...', duration: 600 }
  ];

  useEffect(() => {
    // Simulate analysis progress
    const timer = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsAnalysisComplete(true);
          onCreatorFingerprintUpdate(MOCK_CREATOR_FINGERPRINT);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    // Step progression
    const stepTimer = setInterval(() => {
      setCurrentAnalysisStep(prev => {
        if (prev >= analysisSteps.length - 1) {
          clearInterval(stepTimer);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(stepTimer);
    };
  }, []);

  return (
    <div className={styles.panelContainer}>
      {/* LEFT PANEL: DNA Breakdown + Analysis */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>DNA Breakdown</h3>
          <p className={styles.panelSubtitle}>Viral pattern detection in progress</p>
        </div>
        
        <div className={styles.panelContent}>
          {/* DNA Visualization */}
          <div style={{
            height: '200px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(68, 138, 255, 0.1) 100%)',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              position: 'relative',
              animation: 'spin 4s linear infinite'
            }}>
              <div style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                border: '2px solid #8b5cf6',
                borderRadius: '50%',
                opacity: 0.3
              }} />
              <div style={{
                position: 'absolute',
                width: '80%',
                height: '80%',
                top: '10%',
                left: '10%',
                border: '2px solid #448aff',
                borderRadius: '50%',
                opacity: 0.3
              }} />
              <div style={{
                position: 'absolute',
                width: '60%',
                height: '60%',
                top: '20%',
                left: '20%',
                border: '2px solid #22c55e',
                borderRadius: '50%',
                opacity: 0.3
              }} />
            </div>
            
            {/* Analysis Progress */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                fontSize: '14px'
              }}>
                <span style={{ fontSize: '20px' }}>
                  {analysisSteps[currentAnalysisStep]?.icon}
                </span>
                <span>{analysisSteps[currentAnalysisStep]?.label}</span>
              </div>
              <div style={{
                width: '100%',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${analysisProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #22c55e 0%, #8b5cf6 100%)',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* Retention Graph */}
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
              Retention Graph with Drop-off Points
            </div>
            <div style={{
              height: '100px',
              position: 'relative',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              {/* Retention curve */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70%',
                background: 'linear-gradient(to top, rgba(68, 138, 255, 0.3), transparent)',
                clipPath: 'polygon(0% 100%, 10% 30%, 20% 35%, 30% 25%, 40% 40%, 50% 35%, 60% 45%, 70% 40%, 80% 50%, 90% 45%, 100% 60%, 100% 100%)'
              }} />
              
              {/* Markers */}
              <div style={{
                position: 'absolute',
                left: '15%',
                top: '20%',
                width: '2px',
                height: '60%',
                background: '#22c55e',
                opacity: 0.8
              }} />
              <div style={{
                position: 'absolute',
                left: '70%',
                top: '30%',
                width: '2px',
                height: '50%',
                background: '#22c55e',
                opacity: 0.8
              }} />
            </div>
          </div>

          {/* First 3 Seconds Analyzer */}
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
                width: '85%',
                background: 'linear-gradient(90deg, #22c55e 0%, #8b5cf6 100%)',
                borderRadius: '20px',
                position: 'relative',
                animation: 'pulse 2s ease infinite'
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
                85% Scroll-Stop Power
              </div>
            </div>
          </div>

          {/* Detected Elements Checklist */}
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
              Detected Elements
            </div>
            
            {[
              'Authority signal',
              'Value spike at 0:15',
              'Visual proof element',
              'Strong CTA placement'
            ].map((element, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 0',
                fontSize: '13px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s ease'
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
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
                }}>
                  ✓
                </div>
                <span>{element}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CENTER PANEL: Pattern Detection + Creator Fingerprinting */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Pattern Detection + Creator DNA</h3>
          <p className={styles.panelSubtitle}>Analyzing viral patterns & your unique style</p>
        </div>
        
        <div className={styles.panelContent}>
          {/* Creator Performance Fingerprint */}
          {isAnalysisComplete && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(68, 138, 255, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                <span>🧬</span>
                <span>Your Creator Fingerprint</span>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#8b5cf6'
                  }}>
                    {MOCK_CREATOR_FINGERPRINT.totalVideos}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Videos Analyzed
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#22c55e'
                  }}>
                    {MOCK_CREATOR_FINGERPRINT.averageViralScore}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Avg Viral Score
                  </div>
                </div>
              </div>
              
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '12px'
              }}>
                <strong>Best Framework:</strong> {MOCK_CREATOR_FINGERPRINT.bestPerformingFramework}
              </div>
              
              <div style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.8)',
                marginBottom: '12px'
              }}>
                <strong>Optimal Post Time:</strong> {MOCK_CREATOR_FINGERPRINT.engagement.bestTimeToPost}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontStyle: 'italic'
              }}>
                "Your audience responds best to authority-based content with visual proof"
              </div>
            </div>
          )}

          {/* Feedback Loop Insights */}
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#22c55e'
            }}>
              <span>🔄</span>
              <span>Learning from Your Previous Videos</span>
            </div>

            {FEEDBACK_INSIGHTS.map((insight, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  fontSize: '13px',
                  marginBottom: '4px',
                  color: '#ffffff'
                }}>
                  {insight.insight}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontStyle: 'italic'
                }}>
                  💡 Improvement: +{insight.improvement}
                </div>
              </div>
            ))}
          </div>

          {/* Pattern Analysis Cards */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {DNA_PATTERNS.map((pattern) => (
              <div 
                key={pattern.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '16px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8b5cf6';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    {pattern.name}
                  </div>
                  <div style={{
                    background: 'rgba(68, 138, 255, 0.2)',
                    color: '#448aff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {pattern.confidence}% confidence
                  </div>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: 1.5
                }}>
                  {pattern.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Workspace Configuration */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>Workspace Configuration</h3>
          <p className={styles.panelSubtitle}>Preparing your creation tools</p>
        </div>
        
        <div className={styles.panelContent}>
          {!isAnalysisComplete ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '300px',
              gap: '20px'
            }}>
              <div className={styles.loadingSpinner} style={{
                width: '60px',
                height: '60px',
                borderWidth: '3px'
              }} />
              <div style={{
                fontSize: '14px',
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Configuring workspace...
              </div>
            </div>
          ) : (
            <>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '12px'
                }}>
                  Tools Ready
                </div>
                
                {[
                  { icon: '✓', name: 'Value Template Editor', status: 'Framework loaded successfully' },
                  { icon: '✓', name: 'Real-time Advisor', status: 'AI guidance activated' },
                  { icon: '✓', name: 'Viral Predictor', status: 'Scoring engine ready' }
                ].map((tool, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#22c55e',
                      fontWeight: '600'
                    }}>
                      {tool.icon}
                    </div>
                    <div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {tool.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}>
                        {tool.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
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
                    89%
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Success Rate
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
                    2.1M
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    Est. Views
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        
        <div style={{
          padding: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={() => window.history.back()}
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
              transition: 'all 0.2s ease'
            }}
          >
            ← Back
          </button>

          <button 
            onClick={onProceedToCreation}
            disabled={!isAnalysisComplete}
            style={{
              flex: 1,
              padding: '12px 20px',
              background: isAnalysisComplete 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #448aff 100%)'
                : 'rgba(139, 92, 246, 0.3)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: isAnalysisComplete ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (isAnalysisComplete) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (isAnalysisComplete) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            🎨 Begin Creation
          </button>
        </div>
      </div>
    </div>
  );
}

// Add keyframe animation for pulse
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style); 