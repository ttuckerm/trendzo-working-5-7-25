"use client";

import { useEffect, useState } from 'react';

export default function MockupPage() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMockup() {
      try {
        const res = await fetch('/api/mockup/load');
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setHtml(data.html);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMockup();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading mockup...</div>;
  }

  return (
    <iframe
      srcDoc={html}
      className="w-full h-screen border-0"
      title="Editable Mockup"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    />
  );
}
