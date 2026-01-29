"use client";

import { useEffect, useState } from 'react';

export default function SandboxLandingPage() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelumeSite() {
      try {
        const target = (process.env.NEXT_PUBLIC_CLONE_URL || 'https://www.relume.io/');
        const res = await fetch('/api/sandbox/clone-relume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: target })
        });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        
        const data = await res.json();
        setHtml(typeof data.html === 'string' && data.html.length > 0 ? data.html : '<div style="min-height:100vh;background:black;color:#0f0;display:flex;align-items:center;justify-content:center">Loaded snapshot fallback.</div>');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    
    fetchRelumeSite();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading clone…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  // Render the cloned HTML in a full-page iframe
  return (
    <iframe 
      srcDoc={html}
      className="w-full h-screen border-0"
      title="Sandbox Clone"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}






