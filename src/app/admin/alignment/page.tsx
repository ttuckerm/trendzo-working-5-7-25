"use client";
import React from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AlignmentPage() {
  const { data, error, isLoading, mutate } = useSWR('/api/methodology/alignment', fetcher, {
    revalidateOnFocus: false,
  });

  const forceRefresh = async () => {
    await mutate(fetcher('/api/methodology/alignment?force=true'));
  };

  if (isLoading) return <div className="p-6">Loading alignment…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load: {String(error)}</div>;

  const report = data as {
    generatedAt: string;
    summary: { score: number; level: string; notes: string[] };
    details: any;
    files: { reportMarkdownPath: string };
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Methodology Alignment</h1>
        <button
          onClick={forceRefresh}
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Overall Score</div>
          <div className="text-3xl font-bold">{report.summary.score}%</div>
          <div className="uppercase text-xs mt-1">{report.summary.level}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Generated</div>
          <div>{new Date(report.generatedAt).toLocaleString()}</div>
        </div>
        <div className="rounded border p-4">
          <div className="text-sm text-gray-500">Notes</div>
          <ul className="list-disc ml-5">
            {report.summary.notes?.length ? (
              report.summary.notes.map((n: string) => <li key={n}>{n}</li>)
            ) : (
              <li>No issues detected</li>
            )}
          </ul>
        </div>
      </div>

      <Section title="Admin Tabs" data={report.details.adminTabs} />
      <Section title="API Endpoints" data={report.details.apiEndpoints} />
      <Section title="Data Entities" data={report.details.dataEntities} />
      <Section title="UX Test IDs" data={report.details.uxTestIds} />
      <Section title="Telemetry Events" data={report.details.telemetryEvents} />
    </div>
  );
}

function Section({ title, data }: { title: string; data: any }) {
  return (
    <div className="rounded border p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <span className="text-sm">Coverage: {data.coverage}%</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <List title="Expected" items={data.expected} />
        <List title="Found" items={data.found} />
        <List title="Missing" items={data.missing} />
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="font-medium mb-2">{title}</div>
      <div className="max-h-60 overflow-auto border rounded">
        <ul className="text-sm p-2 space-y-1">
          {items?.length ? items.map((i) => <li key={i}>{i}</li>) : <li className="italic text-gray-500">None</li>}
        </ul>
      </div>
    </div>
  );
}



