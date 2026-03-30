"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalBrain } from '@/contexts/GlobalBrainContext';
import { useWebSocketClient } from '@/app/admin/hooks/useWebSocketClient';
import { getJarvisVoiceService } from '@/lib/services/jarvisVoiceService';
import { getJarvisAdminControlService } from '@/lib/services/jarvisAdminControlService';
import { Mic, MicOff, Brain, Zap, Shield, Eye, Settings, Command, AlertTriangle } from 'lucide-react';
import styles from './super-admin.module.css';

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    webkitAudioContext: any;
  }
}

interface SpeechRecognitionEvent {
  results: any;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface JarvisState {
  isListening: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  mode: 'voice' | 'text' | 'monitoring' | 'admin';
  lastInteraction: Date | null;
  systemHealth: 'optimal' | 'warning' | 'error';
  voiceServiceReady: boolean;
  adminServiceReady: boolean;
}

interface SystemMetrics {
  videosPredicted: number;
  accuracy: number;
  activeConnections: number;
  systemUptime: string;
  lastUpdate: Date;
  alertCount: number;
  memoryUsage: number;
}

export default function JarvisInterface() {
  // Core state management
  const [jarvisState, setJarvisState] = useState<JarvisState>({
    isListening: false,
    isProcessing: false,
    isConnected: false,
    mode: 'voice',
    lastInteraction: null,
    systemHealth: 'optimal',
    voiceServiceReady: false,
    adminServiceReady: false
  });

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    videosPredicted: 26453,
    accuracy: 91.3,
    activeConnections: 7,
    systemUptime: '99.8%',
    lastUpdate: new Date(),
    alertCount: 0,
    memoryUsage: 68.2
  });

  // Hooks and refs
  const { sendMessage, currentContext, isLoading } = useGlobalBrain();
  const { connected: isConnected, send } = useWebSocketClient('/api/ws');
  
  // Service instances
  const voiceServiceRef = useRef(getJarvisVoiceService());
  const adminServiceRef = useRef(getJarvisAdminControlService());

  // Initialize services and subscriptions
  useEffect(() => {
    const voiceService = voiceServiceRef.current;
    const adminService = adminServiceRef.current;

    // Subscribe to voice service events
    const unsubscribeVoice = voiceService.subscribe('jarvis_interface', (data) => {
      switch (data.event) {
        case 'listening_start':
          setJarvisState(prev => ({ ...prev, isListening: true, systemHealth: 'optimal' }));
          break;
        case 'listening_stop':
          setJarvisState(prev => ({ ...prev, isListening: false }));
          break;
        case 'processing_start':
          setJarvisState(prev => ({ ...prev, isProcessing: true }));
          break;
        case 'processing_end':
          setJarvisState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            lastInteraction: new Date() 
          }));
          break;
        case 'speech_error':
          setJarvisState(prev => ({ ...prev, systemHealth: 'warning' }));
          break;
        case 'metrics_update':
          setSystemMetrics(prev => ({ ...prev, ...data.data }));
          break;
      }
    });

    // Subscribe to admin service events
    const unsubscribeAdmin = adminService.subscribe('jarvis_interface', (data) => {
      switch (data.event) {
        case 'status_update':
          const status = data.data;
          setSystemMetrics(prev => ({ 
            ...prev,
            alertCount: status.alerts?.length || 0,
            systemUptime: calculateUptime(status.services)
          }));
          break;
        case 'security_alert':
          setJarvisState(prev => ({ ...prev, systemHealth: 'warning' }));
          setSystemMetrics(prev => ({ ...prev, alertCount: prev.alertCount + 1 }));
          break;
        case 'action_started':
          setJarvisState(prev => ({ ...prev, isProcessing: true }));
          break;
        case 'action_completed':
          setJarvisState(prev => ({ ...prev, isProcessing: false }));
          break;
      }
    });

    // Initialize services
    setJarvisState(prev => ({ 
      ...prev, 
      voiceServiceReady: true, 
      adminServiceReady: true 
    }));

    // Authorize admin service (in real implementation, use proper auth)
    adminService.authorize('super_admin_token');

    return () => {
      unsubscribeVoice();
      unsubscribeAdmin();
    };
  }, []);

  // Calculate system uptime from services
  const calculateUptime = (services: any): string => {
    if (!services) return '99.8%';
    const onlineServices = Object.values(services).filter(status => status === 'online').length;
    const totalServices = Object.values(services).length;
    const uptime = (onlineServices / totalServices) * 100;
    return `${uptime.toFixed(1)}%`;
  };

  // Enhanced voice command processing
  const processVoiceCommand = async (command: string) => {
    try {
      setJarvisState(prev => ({ 
        ...prev, 
        lastInteraction: new Date(),
        isProcessing: true 
      }));

      const lowerCommand = command.toLowerCase();

      // Check for admin commands first
      if (lowerCommand.includes('admin') || lowerCommand.includes('system') || 
          lowerCommand.includes('user') || lowerCommand.includes('database')) {
        
        const response = await adminServiceRef.current.processVoiceCommand(command);
        await speakResponse(response);
        return;
      }

      // Route to voice service for AI processing
      await voiceServiceRef.current.processVoiceCommand(command);

    } catch (error) {
      console.error('Error processing voice command:', error);
      await speakResponse('I encountered an error processing that command.');
    } finally {
      setJarvisState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Enhanced text-to-speech with priority handling
  const speakResponse = async (text: string, priority: 'low' | 'normal' | 'high' = 'normal') => {
    try {
      await voiceServiceRef.current.speak(text, priority);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };

  // Toggle voice listening with service integration
  const toggleListening = () => {
    if (jarvisState.isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Start voice recognition with service integration
  const startListening = () => {
    try {
      voiceServiceRef.current.startListening();
      setJarvisState(prev => ({ 
        ...prev, 
        isListening: true, 
        systemHealth: 'optimal' 
      }));
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      setJarvisState(prev => ({ 
        ...prev, 
        systemHealth: 'error' 
      }));
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    voiceServiceRef.current.stopListening();
    setJarvisState(prev => ({ 
      ...prev, 
      isListening: false 
    }));
  };

  // Enhanced mode cycling with admin mode
  const cycleMode = () => {
    const modes: Array<'voice' | 'text' | 'monitoring' | 'admin'> = ['voice', 'text', 'monitoring', 'admin'];
    const currentIndex = modes.indexOf(jarvisState.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    setJarvisState(prev => ({ ...prev, mode: nextMode }));
    speakResponse(`Switched to ${nextMode} mode.`);
  };

  // Get enhanced status indicator color
  const getStatusColor = () => {
    if (!isConnected || !jarvisState.voiceServiceReady || !jarvisState.adminServiceReady) return '#ff4444';
    if (jarvisState.systemHealth === 'error' || systemMetrics.alertCount > 5) return '#ff4444';
    if (jarvisState.systemHealth === 'warning' || systemMetrics.alertCount > 0) return '#ffaa00';
    if (jarvisState.isListening) return '#00ff88';
    return '#4488ff';
  };

  // Get enhanced mode icon
  const getModeIcon = () => {
    switch (jarvisState.mode) {
      case 'voice': return jarvisState.isListening ? <Mic /> : <MicOff />;
      case 'text': return <Brain />;
      case 'monitoring': return <Eye />;
      case 'admin': return <Command />;
      default: return <Mic />;
    }
  };

  // Quick admin actions
  const executeQuickAdmin = async (action: string) => {
    try {
      setJarvisState(prev => ({ ...prev, isProcessing: true }));
      
      switch (action) {
        case 'system_status':
          const response = await adminServiceRef.current.processVoiceCommand('system status');
          await speakResponse(response, 'high');
          break;
        case 'clear_cache':
          await adminServiceRef.current.executeCommand('cache_clear');
          await speakResponse('Cache cleared successfully.');
          break;
        case 'generate_report':
          await adminServiceRef.current.executeCommand('report_generate', { 
            reportType: 'system_overview', 
            timeRange: 'last_24h' 
          });
          await speakResponse('System report generation started.');
          break;
      }
    } catch (error) {
      console.error('Quick admin action error:', error);
      await speakResponse('Failed to execute admin action.');
    } finally {
      setJarvisState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  return (
    <div 
      className={styles.jarvisInterface}
      data-mode={jarvisState.mode}
      data-health={jarvisState.systemHealth}
      data-connected={isConnected && jarvisState.voiceServiceReady && jarvisState.adminServiceReady}
    >
      {/* Main JARVIS Button */}
      <button
        className={`${styles.jarvisButton} ${jarvisState.isListening ? styles.listening : ''}`}
        onClick={toggleListening}
        onDoubleClick={cycleMode}
        aria-label="JARVIS Voice Interface"
        style={{
          background: `radial-gradient(circle, ${getStatusColor()}20, transparent)`,
          borderColor: getStatusColor(),
          boxShadow: jarvisState.isListening ? `0 0 20px ${getStatusColor()}50` : 'none'
        }}
      >
        <div className={styles.jarvisIcon}>
          {getModeIcon()}
        </div>
        
        {/* Status indicators */}
        <div className={styles.statusRing} style={{ borderColor: getStatusColor() }}>
          <div 
            className={styles.statusDot} 
            style={{ 
              backgroundColor: getStatusColor(),
              animation: jarvisState.isListening ? 'pulse 2s infinite' : 'none'
            }} 
          />
        </div>
      </button>

      {/* Enhanced System Status Panel */}
      {jarvisState.mode === 'monitoring' && (
        <div className={styles.statusPanel}>
          <div className={styles.statusHeader}>
            <Shield className={styles.statusIcon} />
            <span>JARVIS SYSTEM STATUS</span>
          </div>
          
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Videos Processed</span>
              <span className={styles.metricValue}>{systemMetrics.videosPredicted.toLocaleString()}</span>
            </div>
            
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Accuracy</span>
              <span className={styles.metricValue}>{systemMetrics.accuracy}%</span>
            </div>
            
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Active Alerts</span>
              <span className={styles.metricValue} style={{ 
                color: systemMetrics.alertCount > 0 ? '#ff6b6b' : '#00ff88' 
              }}>
                {systemMetrics.alertCount}
              </span>
            </div>
            
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Memory Usage</span>
              <span className={styles.metricValue}>{systemMetrics.memoryUsage.toFixed(1)}%</span>
            </div>
          </div>

          <div className={styles.currentContext}>
            <span className={styles.contextLabel}>Current Context:</span>
            <span className={styles.contextValue}>
              {currentContext?.pageName || 'Admin Dashboard'}
            </span>
          </div>

          {/* Service Status */}
          <div className={styles.currentContext}>
            <span className={styles.contextLabel}>Services:</span>
            <span className={styles.contextValue}>
              Voice: {jarvisState.voiceServiceReady ? '✓' : '✗'} | 
              Admin: {jarvisState.adminServiceReady ? '✓' : '✗'} | 
              WebSocket: {isConnected ? '✓' : '✗'}
            </span>
          </div>
        </div>
      )}

      {/* Admin Control Panel */}
      {jarvisState.mode === 'admin' && (
        <div className={styles.statusPanel}>
          <div className={styles.statusHeader}>
            <Command className={styles.statusIcon} />
            <span>ADMIN CONTROL</span>
          </div>
          
          <div className={styles.adminControls}>
            <button 
              className={styles.adminButton}
              onClick={() => executeQuickAdmin('system_status')}
            >
              System Status
            </button>
            <button 
              className={styles.adminButton}
              onClick={() => executeQuickAdmin('clear_cache')}
            >
              Clear Cache
            </button>
            <button 
              className={styles.adminButton}
              onClick={() => executeQuickAdmin('generate_report')}
            >
              Generate Report
            </button>
          </div>

          <div className={styles.currentContext}>
            <span className={styles.contextLabel}>Voice Commands Available:</span>
            <div className={styles.contextValue} style={{ fontSize: '12px', lineHeight: '1.4' }}>
              "System status", "Clear cache", "Suspend user", "Generate report", 
              "Database backup", "Security scan"
            </div>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {(jarvisState.isProcessing || isLoading) && (
        <div className={styles.processingIndicator}>
          <Zap className={styles.processingIcon} />
          <span>Processing...</span>
        </div>
      )}

      {/* Enhanced Quick Actions */}
      <div className={styles.quickActions}>
        <button 
          className={styles.quickAction}
          onClick={() => executeQuickAdmin('system_status')}
          title="System Status"
        >
          <Shield size={16} />
        </button>
        
        <button 
          className={styles.quickAction}
          onClick={cycleMode}
          title="Change Mode"
        >
          <Settings size={16} />
        </button>

        {systemMetrics.alertCount > 0 && (
          <button 
            className={styles.quickAction}
            onClick={() => speakResponse(`You have ${systemMetrics.alertCount} active alerts. Switch to monitoring mode for details.`)}
            title="View Alerts"
            style={{ color: '#ff6b6b' }}
          >
            <AlertTriangle size={16} />
          </button>
        )}
      </div>

      {/* Connection Status Warning */}
      {(!jarvisState.voiceServiceReady || !jarvisState.adminServiceReady) && (
        <div className={styles.connectionWarning}>
          <AlertTriangle size={16} />
          <span>Service Initialization</span>
        </div>
      )}
    </div>
  );
}