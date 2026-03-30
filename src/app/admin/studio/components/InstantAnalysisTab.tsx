'use client'

import { Zap } from 'lucide-react'

export function InstantAnalysisTab() {
  return (
    <div className="instant-analysis-redirect flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-lg">
        <div className="text-6xl mb-6">⚡</div>
        <h2 className="text-[32px] font-extrabold mb-4">
          Instant Content Analysis
        </h2>
        <p className="text-gray-400 text-lg mb-8">
          Our powerful video analysis engine has moved to a dedicated page with enhanced features including drag-and-drop upload, TikTok URL analysis, and improved AI coaching.
        </p>
        <a
          href="/admin/upload-test"
          className="px-8 py-4 bg-gradient-to-r from-[#e50914] to-[#ff1744] hover:from-[#ff1744] hover:to-[#e50914] text-white font-bold rounded-xl text-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto no-underline"
        >
          <Zap className="w-6 h-6" />
          Open Analysis Engine
        </a>
        <p className="text-gray-500 text-sm mt-4">
          Full-featured analysis with VPS predictions, Pack 1 & Pack 2 insights
        </p>
      </div>
    </div>
  );
}
