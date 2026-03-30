'use client';

import React from 'react';
import ClientCard from '../components/ClientCard';

interface ClientData {
  userId: string;
  name: string;
  niche: string | null;
  lastVPS: number | null;
  status: 'active' | 'warning' | 'inactive';
  videoCount: number;
}

export default function ClientsGrid({ clients }: { clients: ClientData[] }) {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="animate-[fadeSlideUp_0.5s_ease-out_both]">
        <h1 className="text-3xl font-display font-bold text-[#e8e6e3] tracking-tight">
          Client Portfolio
        </h1>
        <p className="text-sm text-[#7a7889] mt-2 font-body">
          {clients.length} creator{clients.length !== 1 ? 's' : ''} across your agency
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((client, i) => (
          <div key={client.userId} style={{ animationDelay: `${i * 60}ms` }}>
            <ClientCard
              name={client.name}
              niche={client.niche}
              lastVPS={client.lastVPS}
              status={client.status}
              videoCount={client.videoCount}
            />
          </div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center space-y-3">
            <p className="text-[#7a7889] text-sm font-body">No creators in this agency yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}
