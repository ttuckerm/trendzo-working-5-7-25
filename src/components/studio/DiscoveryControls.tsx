'use client';

import React, { useState } from 'react';

interface DiscoveryResult {
  success: boolean;
  templatesDiscovered: number;
  patterns: Array<{
    name: string;
    description: string;
    successRate: number;
    usageCount: number;
    frameworkType: string;
  }>;
}

export const DiscoveryControls: React.FC = () => {
  const [discovering, setDiscovering] = useState(false);
  const [lastRun, setLastRun] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiscovery = async () => {
    setDiscovering(true);
    setError(null);
    
    try {
      const response = await fetch('/api/studio/discover-templates', { method: 'POST' });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Discovery failed');
      }
      
      setLastRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed');
      console.error('Discovery failed:', err);
    } finally {
      setDiscovering(false);
    }
  };

  return (
    <div className="discovery-controls">
      <div className="discovery-header">
        <h3>🔍 Template Discovery Engine</h3>
        <p>Analyze viral videos to discover new patterns and templates</p>
      </div>
      
      <div className="discovery-actions">
        <button 
          onClick={runDiscovery} 
          disabled={discovering}
          className="discovery-button"
        >
          {discovering ? (
            <>
              <div className="spinner" />
              Discovering Patterns...
            </>
          ) : (
            <>
              🔍 Run Template Discovery
            </>
          )}
        </button>
        
        {lastRun && (
          <div className="discovery-results">
            <div className="results-header">
              <span className="results-icon">✅</span>
              <span className="results-text">
                Discovered {lastRun.templatesDiscovered} viral patterns
              </span>
            </div>
            
            {lastRun.patterns && lastRun.patterns.length > 0 && (
              <div className="patterns-preview">
                <h4>Top Patterns Found:</h4>
                <div className="patterns-grid">
                  {lastRun.patterns.slice(0, 6).map((pattern, index) => (
                    <div key={index} className="pattern-card">
                      <div className="pattern-name">{pattern.name}</div>
                      <div className="pattern-success">{pattern.successRate}% Success</div>
                      <div className="pattern-usage">{pattern.usageCount} uses</div>
                      <div className="pattern-type">{pattern.frameworkType}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {error && (
          <div className="discovery-error">
            <span className="error-icon">❌</span>
            <span className="error-text">{error}</span>
          </div>
        )}
      </div>

      <style jsx>{`
        .discovery-controls {
          background: #1A1A1A;
          border-radius: 12px;
          padding: 24px;
          margin: 20px 0;
          border: 1px solid #262626;
        }

        .discovery-header {
          margin-bottom: 20px;
        }

        .discovery-header h3 {
          font-size: 20px;
          margin: 0 0 8px 0;
          color: #fff;
        }

        .discovery-header p {
          color: #888;
          margin: 0;
          font-size: 14px;
        }

        .discovery-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .discovery-button {
          background: linear-gradient(135deg, #FF4444, #ff6b6b);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 56px;
        }

        .discovery-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 68, 68, 0.3);
        }

        .discovery-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .discovery-results {
          background: #0F0F0F;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #4CAF50;
        }

        .results-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .results-icon {
          font-size: 18px;
        }

        .results-text {
          font-size: 16px;
          font-weight: 600;
          color: #4CAF50;
        }

        .patterns-preview h4 {
          font-size: 14px;
          margin: 0 0 12px 0;
          color: #ccc;
        }

        .patterns-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .pattern-card {
          background: #262626;
          border-radius: 6px;
          padding: 12px;
          border: 1px solid #404040;
        }

        .pattern-name {
          font-size: 13px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 6px;
        }

        .pattern-success {
          font-size: 12px;
          color: #4CAF50;
          font-weight: 600;
        }

        .pattern-usage {
          font-size: 11px;
          color: #888;
        }

        .pattern-type {
          font-size: 10px;
          color: #666;
          background: #404040;
          padding: 2px 6px;
          border-radius: 3px;
          display: inline-block;
          margin-top: 6px;
        }

        .discovery-error {
          background: #2D1B1B;
          border: 1px solid #FF4444;
          border-radius: 6px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-icon {
          font-size: 16px;
        }

        .error-text {
          color: #FF4444;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};