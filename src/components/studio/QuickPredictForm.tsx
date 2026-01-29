'use client';

import { useState } from 'react';

interface QuickPredictFormProps {
  onClose: () => void;
  onSuccess?: () => void; // Callback for when video is successfully added
}

interface PredictionResult {
  id: string;
  message: string;
}

export default function QuickPredictForm({ onClose, onSuccess }: QuickPredictFormProps) {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      // Check if it's a common video platform URL
      const videoPatterns = [
        /tiktok\.com/,
        /youtube\.com/,
        /youtu\.be/,
        /instagram\.com/,
        /facebook\.com/,
        /twitter\.com/,
        /x\.com/
      ];
      return videoPatterns.some(pattern => pattern.test(url));
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (!validateUrl(videoUrl)) {
      setError('Please enter a valid video URL from TikTok, YouTube, Instagram, or other supported platforms');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('[FRONTEND] Starting video analysis request for URL:', videoUrl);
      
      const response = await fetch('/api/studio/quick-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      });

      console.log('[FRONTEND] API response received:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('[FRONTEND] API response data:', data);

      if (!response.ok) {
        // Use the detailed error message from API if available
        const errorMessage = data.details ? 
          `${data.error || 'Failed to analyze video'}: ${data.details}` : 
          data.error || 'Failed to analyze video';
        
        console.error('[FRONTEND] API error response:', {
          status: response.status,
          error: data.error,
          details: data.details,
          fullMessage: errorMessage
        });
        
        throw new Error(errorMessage);
      }

      if (data.success) {
        console.log('[FRONTEND] Video analysis successful:', data.id);
        setResult({
          id: data.id,
          message: data.message || 'Video successfully analyzed and added to Proving Grounds!'
        });
        
        // Call success callback to refresh the main page
        if (onSuccess) {
          onSuccess();
        }
      } else {
        // Handle case where response is OK but success is false
        const errorMessage = data.details ? 
          `${data.error || 'Analysis failed'}: ${data.details}` : 
          data.error || 'Analysis failed';
        
        console.error('[FRONTEND] Analysis failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('[FRONTEND] Prediction error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('[FRONTEND] Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setVideoUrl('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="quick-predict-form">
      <div className="form-header">
        <h2>⚡ Quick Predict</h2>
        <p>Get instant viral potential analysis for any video URL</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="predict-form">
          <div className="form-group">
            <label htmlFor="videoUrl" className="form-label">
              Video URL
            </label>
            <input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://tiktok.com/@username/video/..."
              className="form-input"
              disabled={isLoading}
            />
            <div className="form-hint">
              Supports TikTok, YouTube, Instagram, and other video platforms
            </div>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-header">
                <span className="error-icon">⚠️</span>
                <strong>Analysis Failed</strong>
              </div>
              <div className="error-details">
                {error}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !videoUrl.trim()}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>⚡ Predict Now</>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="prediction-result">
          <div className="result-header">
            <div className="success-icon">✅</div>
            <h3>Analysis Complete!</h3>
          </div>

          <div className="success-message">
            <div className="message-content">
              <h4>Video Added Successfully!</h4>
              <p>{result.message}</p>
              <div className="video-id">
                <small>Video ID: {result.id}</small>
              </div>
            </div>
          </div>

          <div className="result-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-secondary"
            >
              Analyze Another
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-primary"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .quick-predict-form {
          min-height: 300px;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-header h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #fff;
        }

        .form-header p {
          color: #999;
          margin: 0;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-weight: 500;
          margin-bottom: 8px;
          color: #fff;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: #333;
          border: 1px solid #555;
          border-radius: 8px;
          color: #fff;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #007acc;
          box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-hint {
          font-size: 14px;
          color: #666;
          margin-top: 6px;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .error-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .error-icon {
          font-size: 16px;
        }

        .error-details {
          line-height: 1.4;
          opacity: 0.9;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #444;
          color: #fff;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #555;
        }

        .btn-primary {
          background: #007acc;
          color: #fff;
        }

        .btn-primary:hover:not(:disabled) {
          background: #0066aa;
        }

        .spinner {
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

        .prediction-result {
          text-align: center;
        }

        .result-header {
          margin-bottom: 24px;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .result-header h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #fff;
        }

        .success-message {
          background: #222;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          text-align: left;
        }

        .message-content h4 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #00ff88;
        }

        .message-content p {
          color: #ccc;
          line-height: 1.5;
          margin: 0 0 16px 0;
        }

        .video-id {
          padding: 8px 12px;
          background: #333;
          border-radius: 6px;
          font-family: monospace;
        }

        .video-id small {
          color: #999;
          font-size: 12px;
        }

        .result-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        @media (max-width: 480px) {
          .form-actions, .result-actions {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}