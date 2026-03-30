"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function IntegrationStatusPage() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [latestProof, setLatestProof] = useState<{ path: string; absolute_path: string; download_url: string } | null>(null);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    if (!user || !isAdmin) return;
    fetch('/api/admin/integration/status').then(r => r.json()).then(setData).catch(e => setErr(String(e)));
    fetch('/api/admin/integration/proof/latest')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('no proof')))
      .then(json => setLatestProof({ path: json.path, absolute_path: json.absolute_path, download_url: json.download_url }))
      .catch(() => setLatestProof(null));
  }, [user, isAdmin]);

  if (!user || !isAdmin) return <pre>Admin access required</pre>;
  if (err) return <pre>{err}</pre>;
  if (!data) return <pre>Loading…</pre>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Integration Health</h2>
      {latestProof && (
        <div className="mb-3 text-sm">
          <div className="mb-1">Latest proof pack: <code>{latestProof.path}</code></div>
          <a className="text-blue-600 underline" href={latestProof.download_url}>Download latest proof</a>
        </div>
      )}
      <pre className="text-sm bg-black/5 p-3 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}


