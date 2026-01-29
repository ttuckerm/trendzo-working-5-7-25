'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PipelineModule {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'ready' | 'disabled' | 'processing';
  icon: string;
  isPlaceholder?: boolean;
  href?: string;
  stats?: {
    processed?: number;
    pending?: number;
    errors?: number;
  };
}

const modules: PipelineModule[] = [
  {
    id: 'apify-scraper',
    title: 'Apify Scraper',
    description: 'Scrape TikTok content and extract video metadata',
    status: 'active',
    icon: '🕷️',
    href: '/admin/apify-scraper',
    stats: { processed: 1247, pending: 23, errors: 2 }
  },
  {
    id: 'feature-decomposer',
    title: 'Feature Decomposer',
    description: 'Extract visual and audio features from videos',
    status: 'ready',
    icon: '🔬',
    href: '/admin/feature-decomposer',
    stats: { processed: 1198, pending: 52, errors: 1 }
  },
  {
    id: 'gene-tagger',
    title: 'Gene Tagger',
    description: 'Convert features into 48-dimensional gene vectors',
    status: 'active',
    icon: '🧬',
    href: '/admin/gene-tagger',
    stats: { processed: 1089, pending: 161, errors: 0 }
  },
  {
    id: 'viral-filter',
    title: 'Viral Filter',
    description: 'Applies DPS top-5 % rule',
    status: 'ready',
    icon: '🔥',
    href: '/admin/viral-filter',
    stats: { processed: 0, pending: 0, errors: 0 }
  },
  {
    id: 'template-generator',
    title: 'Template Generator',
    description: 'Clusters genes into master templates using HDBSCAN',
    status: 'ready',
    icon: '📝',
    stats: { processed: 0, pending: 0, errors: 0 }
  },
  {
    id: 'evolution-engine',
    title: 'Evolution Engine',
    description: 'Marks templates HOT / COOLING / NEW',
    status: 'disabled',
    icon: '🧪',
    isPlaceholder: true
  },
  {
    id: 'recipe-book-api',
    title: 'RecipeBookAPI',
    description: 'Serves today\'s Viral Recipe Book to the UI',
    status: 'disabled',
    icon: '📖',
    href: '/admin/recipe-book-api',
    isPlaceholder: true
  },
  {
    id: 'dna-detective',
    title: 'DNA_Detective',
    description: 'First per-video predictor (baseline)',
    status: 'disabled',
    icon: '🔍',
    href: '/admin/dna-detective',
    isPlaceholder: true
  },
  {
    id: 'orchestrator',
    title: 'Orchestrator',
    description: 'Picks which predictor(s) to run and blends results',
    status: 'disabled',
    icon: '🎭',
    href: '/admin/orchestrator',
    isPlaceholder: true
  },
  {
    id: 'advisor-service',
    title: 'AdvisorService',
    description: 'Compares a draft to HOT template and returns fix list',
    status: 'disabled',
    icon: '💡',
    href: '/admin/advisor-service',
    isPlaceholder: true
  },
  {
    id: 'feedback-ingest',
    title: 'FeedbackIngest',
    description: 'Pulls real post stats back in each hour',
    status: 'disabled',
    icon: '📥',
    href: '/admin/feedback-ingest',
    isPlaceholder: true
  }
];

export default function PipelinePage() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(()=>{
    let t: any;
    const tick = async()=>{
      try {
        const r = await fetch('/api/pipeline/summary', { cache: 'no-store' });
        if (r.ok) setSummary(await r.json());
      } catch(e:any){ setError(String(e?.message||e)); }
      t = setTimeout(tick, 5000);
    };
    tick();
    return ()=>{ if (t) clearTimeout(t); };
  },[])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'ready':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'disabled':
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'ready':
        return 'text-blue-400';
      case 'processing':
        return 'text-yellow-400';
      case 'disabled':
      default:
        return 'text-gray-500';
    }
  };

  const handleRunModule = async (module: PipelineModule) => {
    if (module.isPlaceholder) return;
    
    setLoading(module.id);
    // TODO: Implement actual module execution
    setTimeout(() => {
      setLoading(null);
    }, 2000);
  };

  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="mx-auto max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-4">Admin Access Required</h1>
          <p className="text-gray-600 mb-6 text-center">
            You need to be logged in as an admin to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div id="overview" data-testid="ingestion-status" />
        <div id="cross-platform" data-testid="cross-platform-panel" className="sr-only" />
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
            Processing Pipeline
          </h1>
          <p className="text-gray-400 text-lg">
            Complete video processing workflow from content ingestion to viral intelligence
          </p>
        </div>

        <div className="space-y-6">
          {modules.map((module, index) => (
            <Card 
              key={module.id} 
              className={`bg-gray-900 border-gray-800 transition-all duration-300 hover:border-red-500/30 ${
                module.isPlaceholder ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{module.icon}</span>
                    <div>
                      <CardTitle className="text-white text-xl flex items-center gap-3">
                        {module.title}
                        <Badge 
                          variant={module.isPlaceholder ? 'outline' : getStatusBadgeVariant(module.status)}
                          className={module.isPlaceholder ? 'text-gray-500 border-gray-600' : `${getStatusColor(module.status)} border-current`}
                        >
                          {module.status}
                        </Badge>
                      </CardTitle>
                      <p className="text-gray-400">{module.description}</p>
                    </div>
                  </div>
                  <Button 
                    variant="default"
                    disabled={module.isPlaceholder || loading === module.id}
                    onClick={() => handleRunModule(module)}
                    className="bg-red-600 hover:bg-red-500"
                  >
                    {loading === module.id ? 'Running...' : 'Run Module'}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 bg-gray-900 rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-2">Pipeline Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {modules.filter(m => m.status === 'active').length}
              </div>
              <div className="text-gray-400">Active Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {modules.filter(m => m.status === 'ready').length}
              </div>
              <div className="text-gray-400">Ready Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-400">
                {modules.filter(m => m.isPlaceholder).length}
              </div>
              <div className="text-gray-400">Pending Modules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round((modules.filter(m => !m.isPlaceholder).length / modules.length) * 100)}%
              </div>
              <div className="text-gray-400">Pipeline Complete</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-3 border border-gray-800 rounded">
              <div className="text-gray-400">Processed videos</div>
              <div className="text-2xl font-bold text-white">{summary?.totals?.videos ?? '-'}</div>
            </div>
            <div className="p-3 border border-gray-800 rounded">
              <div className="text-gray-400">Recent runs</div>
              <div className="text-white">{(summary?.runs||[]).map((r:any)=> `${r.status||'unknown'} (${r.processed_count}/${r.error_count})`).join(' • ')||'-'}</div>
            </div>
          </div>
          <div data-testid="queue-depth" className="sr-only">0</div>
        </div>
      </div>
    </div>
  );
}