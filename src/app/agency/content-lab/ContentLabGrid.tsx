'use client';

import React from 'react';
import ConceptCard from '../components/ConceptCard';

interface ConceptData {
  title: string;
  tags: string[];
  vpsScore: number;
  gradientFrom: string;
  gradientTo: string;
}

export default function ContentLabGrid({ concepts }: { concepts: ConceptData[] }) {
  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="animate-[fadeSlideUp_0.5s_ease-out_both]">
        <h1 className="text-3xl font-display font-bold text-[#e8e6e3] tracking-tight">
          Content Lab
        </h1>
        <p className="text-sm text-[#7a7889] mt-2 font-body">
          AI-generated content concepts ranked by predicted virality
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {concepts.map((concept, i) => (
          <div key={i} style={{ animationDelay: `${i * 80}ms` }}>
            <ConceptCard
              title={concept.title}
              tags={concept.tags}
              vpsScore={concept.vpsScore}
              gradientFrom={concept.gradientFrom}
              gradientTo={concept.gradientTo}
            />
          </div>
        ))}
      </div>

      {concepts.length === 0 && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <p className="text-[#7a7889] text-sm font-body">No content concepts available yet.</p>
        </div>
      )}
    </div>
  );
}
