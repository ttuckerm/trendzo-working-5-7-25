'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error details for debugging
    console.error('Viral Prediction Error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000 0%, #1a0033 50%, #000 100%)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '3rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          marginBottom: '1rem',
          background: 'linear-gradient(135deg, #FF6B9D, #C147E9)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Viral Prediction System Error
        </h2>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          marginBottom: '2rem',
          lineHeight: '1.5'
        }}>
          The viral prediction system encountered an error. This might be due to browser extensions or development tools interfering with the analysis.
        </p>
        <button
          onClick={reset}
          style={{
            background: 'linear-gradient(135deg, #FF6B9D, #C147E9)',
            border: 'none',
            borderRadius: '16px',
            padding: '1rem 2rem',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer',
            marginRight: '1rem'
          }}
        >
          🔄 Retry Analysis
        </button>
        <button
          onClick={() => window.location.href = '/admin'}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '1rem 2rem',
            color: '#fff',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🏠 Back to Admin
        </button>
      </div>
    </div>
  );
}