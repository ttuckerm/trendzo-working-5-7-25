'use client';

import { useState, useEffect } from 'react';
import { SystemAlert } from '@/lib/services/alertService';

interface SystemAlertsDisplayProps {
  className?: string;
}

export default function SystemAlertsDisplay({ className = '' }: SystemAlertsDisplayProps) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[SYSTEM ALERTS UI] Fetching unread alerts...');
      
      const response = await fetch('/api/system-alerts?unread=true');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch alerts');
      }
      
      console.log(`[SYSTEM ALERTS UI] Received ${data.data?.length || 0} unread alerts`);
      setAlerts(data.data || []);
      
    } catch (err) {
      console.error('[SYSTEM ALERTS UI] Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const markAlertAsRead = async (alertId: number) => {
    try {
      console.log(`[SYSTEM ALERTS UI] Marking alert ${alertId} as read`);
      
      const response = await fetch('/api/system-alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: alertId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark alert as read');
      }

      // Remove the alert from the list
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      console.log(`[SYSTEM ALERTS UI] Alert ${alertId} marked as read and removed from list`);
      
    } catch (err) {
      console.error('[SYSTEM ALERTS UI] Error marking alert as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      console.log('[SYSTEM ALERTS UI] Marking all alerts as read');
      
      const response = await fetch('/api/system-alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAllAsRead: true }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark all alerts as read');
      }

      setAlerts([]);
      setIsExpanded(false);
      console.log('[SYSTEM ALERTS UI] All alerts marked as read');
      
    } catch (err) {
      console.error('[SYSTEM ALERTS UI] Error marking all alerts as read:', err);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity) {
      case 'error': return 'alert-error';
      case 'warning': return 'alert-warning';
      case 'info': return 'alert-info';
      default: return 'alert-info';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - alertTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  useEffect(() => {
    fetchAlerts();
    
    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading && alerts.length === 0) {
    return (
      <div className={`system-alerts-display ${className}`}>
        <div className="alerts-loading">
          <span className="loading-spinner"></span>
          Loading alerts...
        </div>
        
        <style jsx>{`
          .system-alerts-display {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
          }
          
          .alerts-loading {
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid transparent;
            border-top: 2px solid currentColor;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`system-alerts-display ${className}`}>
        <div className="alerts-error">
          <span>⚠️</span>
          <span>Error loading alerts: {error}</span>
          <button onClick={fetchAlerts}>Retry</button>
        </div>
        
        <style jsx>{`
          .system-alerts-display {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
          }
          
          .alerts-error {
            background: rgba(239, 68, 68, 0.9);
            color: #fff;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .alerts-error button {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
          }
          
          .alerts-error button:hover {
            background: rgba(255, 255, 255, 0.3);
          }
        `}</style>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null; // Don't show anything if no alerts
  }

  return (
    <div className={`system-alerts-display ${className}`}>
      <div className="alerts-container">
        <div className="alerts-header" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="alerts-indicator">
            <span className="alerts-icon">🔔</span>
            <span className="alerts-count">{alerts.length}</span>
          </div>
          <span className="alerts-label">System Alerts</span>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
        
        {isExpanded && (
          <div className="alerts-list">
            <div className="alerts-actions">
              <button onClick={markAllAsRead} className="mark-all-read">
                Mark All Read
              </button>
            </div>
            
            {alerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`alert-item ${getSeverityClass(alert.severity)}`}
              >
                <div className="alert-header">
                  <span className="alert-icon">{getSeverityIcon(alert.severity)}</span>
                  <span className="alert-source">{alert.source}</span>
                  <span className="alert-time">{formatTimeAgo(alert.created_at)}</span>
                  <button 
                    onClick={() => markAlertAsRead(alert.id)}
                    className="alert-close"
                  >
                    ✕
                  </button>
                </div>
                <div className="alert-message">{alert.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .system-alerts-display {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          max-width: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .alerts-container {
          background: rgba(0, 0, 0, 0.95);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .alerts-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.05);
          transition: background 0.2s ease;
        }
        
        .alerts-header:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .alerts-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-right: 12px;
        }
        
        .alerts-icon {
          font-size: 18px;
        }
        
        .alerts-count {
          background: #ef4444;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }
        
        .alerts-label {
          color: #fff;
          font-weight: 500;
          flex: 1;
        }
        
        .expand-icon {
          color: #999;
          font-size: 12px;
        }
        
        .alerts-list {
          max-height: 400px;
          overflow-y: auto;
        }
        
        .alerts-actions {
          padding: 8px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .mark-all-read {
          background: rgba(59, 130, 246, 0.2);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #60a5fa;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        
        .mark-all-read:hover {
          background: rgba(59, 130, 246, 0.3);
        }
        
        .alert-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .alert-item:last-child {
          border-bottom: none;
        }
        
        .alert-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        
        .alert-icon {
          font-size: 16px;
        }
        
        .alert-source {
          color: #999;
          font-size: 12px;
          font-weight: 500;
          flex: 1;
        }
        
        .alert-time {
          color: #666;
          font-size: 11px;
        }
        
        .alert-close {
          background: none;
          border: none;
          color: #666;
          cursor: pointer;
          padding: 2px;
          border-radius: 2px;
          font-size: 12px;
          transition: color 0.2s ease;
        }
        
        .alert-close:hover {
          color: #fff;
        }
        
        .alert-message {
          color: #fff;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .alert-error {
          border-left: 3px solid #ef4444;
        }
        
        .alert-warning {
          border-left: 3px solid #f59e0b;
        }
        
        .alert-info {
          border-left: 3px solid #3b82f6;
        }
        
        .alerts-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .alerts-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        
        .alerts-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .alerts-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}