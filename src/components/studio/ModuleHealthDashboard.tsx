'use client';

import React, { useEffect, useState } from 'react';
import { ModuleHealth } from '@/types/trendzo-schema';

interface HealthSummary {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  totalProcessed: number;
}

interface ModuleHealthData {
  modules: ModuleHealth[];
  summary: HealthSummary;
}

export const ModuleHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<ModuleHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModuleHealth();
    // Refresh every 30 seconds
    const interval = setInterval(fetchModuleHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchModuleHealth = async () => {
    try {
      const response = await fetch('/api/studio/module-health');
      if (!response.ok) throw new Error('Failed to fetch module health');
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load module health data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'green': return '#10B981';
      case 'yellow': return '#F59E0B';
      case 'red': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green': return '✅';
      case 'yellow': return '⚠️';
      case 'red': return '🚨';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div className="module-health-dashboard">
        <div className="loading-spinner">Loading module health...</div>
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div className="module-health-dashboard">
        <div className="error-message">{error || 'No data available'}</div>
      </div>
    );
  }

  return (
    <div className="module-health-dashboard">
      {/* Summary Stats */}
      <div className="health-summary">
        <div className="summary-stat">
          <span className="stat-value">{healthData.summary.totalProcessed.toLocaleString()}</span>
          <span className="stat-label">Total Processed</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value" style={{color: '#10B981'}}>{healthData.summary.healthy}</span>
          <span className="stat-label">Healthy</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value" style={{color: '#F59E0B'}}>{healthData.summary.warning}</span>
          <span className="stat-label">Warning</span>
        </div>
        <div className="summary-stat">
          <span className="stat-value" style={{color: '#EF4444'}}>{healthData.summary.critical}</span>
          <span className="stat-label">Critical</span>
        </div>
      </div>

      {/* Module Grid */}
      <div className="modules-grid">
        {healthData.modules.map((module) => (
          <div key={module.id} className="module-card">
            <div className="module-header">
              <span className="module-name">{module.module_name}</span>
              <span className="module-status-icon">{getStatusIcon(module.status)}</span>
            </div>
            <div className="module-stats">
              <div className="module-stat">
                <span className="stat-label">Processed</span>
                <span className="stat-value">{module.processed_count.toLocaleString()}</span>
              </div>
              <div className="module-stat">
                <span className="stat-label">Uptime</span>
                <span className="stat-value">{module.uptime_percentage}%</span>
              </div>
            </div>
            <div 
              className="module-status-bar" 
              style={{backgroundColor: getStatusColor(module.status)}}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        .module-health-dashboard {
          padding: 20px;
          background: #0F0F0F;
          border-radius: 12px;
          margin: 20px 0;
        }

        .health-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .summary-stat {
          text-align: center;
          padding: 20px;
          background: #1A1A1A;
          border-radius: 8px;
          border: 1px solid #262626;
        }

        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .modules-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .module-card {
          background: #1A1A1A;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .module-card:hover {
          border-color: #404040;
          transform: translateY(-2px);
        }

        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .module-name {
          font-weight: 600;
          font-size: 14px;
        }

        .module-status-icon {
          font-size: 18px;
        }

        .module-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .module-stat {
          text-align: center;
        }

        .module-stat .stat-label {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .module-stat .stat-value {
          display: block;
          font-size: 16px;
          font-weight: 600;
        }

        .module-status-bar {
          height: 3px;
          border-radius: 2px;
          margin-top: 8px;
        }

        .loading-spinner, .error-message {
          text-align: center;
          padding: 40px;
          color: #888;
        }
      `}</style>
    </div>
  );
};