'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  PreContentPredictionRequest,
  PreContentPredictionResponse,
  ViralTier
} from '@/types/pre-content-prediction';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// Types
// ============================================================================

interface ExtractedKeyword {
  keyword: string;
  source: string;
  confidence: number;
  category?: string;
  video_count?: number;
  avg_dps?: number;
  status?: 'pending' | 'approved' | 'rejected';
}

interface KeywordStats {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  sources: {
    gpt4: number;
    claude: number;
    gemini: number;
    patterns: number;
  };
}

// ============================================================================
// Script Intelligence (Research Review) Page
// ============================================================================

export default function ScriptIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'keywords' | 'predictor'>('keywords');

  // ====== KEYWORD RESEARCH TAB STATE ======
  const [keywords, setKeywords] = useState<ExtractedKeyword[]>([]);
  const [keywordStats, setKeywordStats] = useState<KeywordStats>({
    total: 0,
    highConfidence: 0,
    mediumConfidence: 0,
    lowConfidence: 0,
    sources: { gpt4: 0, claude: 0, gemini: 0, patterns: 0 }
  });
  const [keywordFilter, setKeywordFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [loadingKeywords, setLoadingKeywords] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [extractionMessage, setExtractionMessage] = useState<string>('');
  const [extractionStatus, setExtractionStatus] = useState<'success' | 'error' | 'loading' | 'info'>('info');

  // ====== SCRIPT PREDICTOR TAB STATE ======
  const [scriptText, setScriptText] = useState('');
  const [scriptNiche, setScriptNiche] = useState('general');
  const [scriptPlatform, setScriptPlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PreContentPredictionResponse | null>(null);

  // ====== LOAD KEYWORDS ON MOUNT ======
  useEffect(() => {
    loadExtractedKeywords();
  }, []);

  // ============================================================================
  // KEYWORD RESEARCH FUNCTIONS
  // ============================================================================

  async function loadExtractedKeywords() {
    try {
      setLoadingKeywords(true);

      // Query FEAT-060 extracted_knowledge table to get consensus insights
      const { data, error } = await supabase
        .from('extracted_knowledge')
        .select('consensus_insights, confidence_score, gpt4_analysis, claude_analysis, gemini_analysis')
        .order('extraction_timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Extract keywords from consensus_insights JSONB
      const extractedKeywords: ExtractedKeyword[] = [];
      const sources = { gpt4: 0, claude: 0, gemini: 0, patterns: 0 };

      data?.forEach(row => {
        const insights = row.consensus_insights as any;

        // Extract viral hooks (field name: viral_hooks)
        if (insights?.viral_hooks && Array.isArray(insights.viral_hooks)) {
          insights.viral_hooks.forEach((hook: string) => {
            extractedKeywords.push({
              keyword: hook,
              source: 'Multi-LLM Consensus',
              confidence: row.confidence_score || insights.confidence || 0.8,
              category: 'hook',
              status: 'pending'
            });
          });
        }

        // Also check old field name for backward compatibility
        if (insights?.hooks && Array.isArray(insights.hooks)) {
          insights.hooks.forEach((hook: string) => {
            extractedKeywords.push({
              keyword: hook,
              source: 'Multi-LLM Consensus',
              confidence: row.confidence_score || 0.8,
              category: 'hook',
              status: 'pending'
            });
          });
        }

        // Extract emotional triggers (field name: emotional_triggers)
        if (insights?.emotional_triggers && Array.isArray(insights.emotional_triggers)) {
          insights.emotional_triggers.forEach((trigger: string) => {
            extractedKeywords.push({
              keyword: trigger,
              source: 'Multi-LLM Consensus',
              confidence: row.confidence_score || insights.confidence || 0.8,
              category: 'trigger',
              status: 'pending'
            });
          });
        }

        // Also check old field name for backward compatibility
        if (insights?.triggers && Array.isArray(insights.triggers)) {
          insights.triggers.forEach((trigger: string) => {
            extractedKeywords.push({
              keyword: trigger,
              source: 'Multi-LLM Consensus',
              confidence: row.confidence_score || 0.8,
              category: 'trigger',
              status: 'pending'
            });
          });
        }

        // Extract viral coefficient factors as keywords
        if (insights?.viral_coefficient_factors && Array.isArray(insights.viral_coefficient_factors)) {
          insights.viral_coefficient_factors.forEach((factor: string) => {
            extractedKeywords.push({
              keyword: factor,
              source: 'Multi-LLM Consensus',
              confidence: row.confidence_score || insights.confidence || 0.8,
              category: 'keyword',
              status: 'pending'
            });
          });
        }

        // Extract pattern match as keyword if present
        if (insights?.pattern_match && typeof insights.pattern_match === 'string') {
          extractedKeywords.push({
            keyword: insights.pattern_match,
            source: 'Pattern Match',
            confidence: row.confidence_score || insights.confidence || 0.8,
            category: 'pattern',
            status: 'pending'
          });
        }

        // Also check old keywords field for backward compatibility
        if (insights?.keywords && Array.isArray(insights.keywords)) {
          insights.keywords.forEach((keyword: string) => {
            extractedKeywords.push({
              keyword: keyword,
              source: 'Multi-LLM Consensus',
              confidence: row.confidence_score || 0.8,
              category: 'keyword',
              status: 'pending'
            });
          });
        }

        // Count sources
        if (row.gpt4_analysis) sources.gpt4++;
        if (row.claude_analysis) sources.claude++;
        if (row.gemini_analysis) sources.gemini++;
      });

      // Remove duplicates
      const uniqueKeywords = extractedKeywords.reduce((acc, curr) => {
        if (!acc.find(k => k.keyword === curr.keyword)) {
          acc.push(curr);
        }
        return acc;
      }, [] as ExtractedKeyword[]);

      setKeywords(uniqueKeywords);

      // Calculate stats
      const stats: KeywordStats = {
        total: uniqueKeywords.length,
        highConfidence: uniqueKeywords.filter(k => k.confidence >= 0.8).length,
        mediumConfidence: uniqueKeywords.filter(k => k.confidence >= 0.5 && k.confidence < 0.8).length,
        lowConfidence: uniqueKeywords.filter(k => k.confidence < 0.5).length,
        sources
      };

      setKeywordStats(stats);
      setLoadingKeywords(false);
    } catch (error) {
      console.error('Error loading keywords:', error);
      setLoadingKeywords(false);
    }
  }

  function toggleKeywordStatus(keyword: string, status: 'approved' | 'rejected') {
    setKeywords(keywords.map(k =>
      k.keyword === keyword
        ? { ...k, status: k.status === status ? 'pending' : status }
        : k
    ));
  }

  function toggleKeywordSelection(keyword: string) {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  }

  function bulkApprove() {
    setKeywords(keywords.map(k =>
      selectedKeywords.has(k.keyword) ? { ...k, status: 'approved' } : k
    ));
    setSelectedKeywords(new Set());
  }

  function bulkReject() {
    setKeywords(keywords.map(k =>
      selectedKeywords.has(k.keyword) ? { ...k, status: 'rejected' } : k
    ));
    setSelectedKeywords(new Set());
  }

  async function runKnowledgeExtraction() {
    try {
      setExtracting(true);
      setExtractionStatus('loading');
      setExtractionMessage('Finding videos to process...');

      // Find videos with transcripts but no extracted knowledge
      const { data: videos, error: fetchError } = await supabase
        .from('scraped_videos')
        .select('video_id, caption, transcript_text, dps_score')
        .not('transcript_text', 'is', null)
        .not('dps_score', 'is', null)
        .limit(20); // Process 20 at a time

      if (fetchError) throw fetchError;

      if (!videos || videos.length === 0) {
        setExtractionStatus('info');
        setExtractionMessage('No videos found with transcripts. Please run transcription first!');
        setTimeout(() => setExtractionMessage(''), 5000);
        setExtracting(false);
        return;
      }

      setExtractionStatus('loading');
      setExtractionMessage(`Processing ${videos.length} videos with FEAT-060 (GPT-4 + Claude + Gemini)...`);

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        setExtractionMessage(`Extracting knowledge ${i + 1}/${videos.length}: ${video.video_id}`);

        try {
          const response = await fetch('/api/knowledge/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id: video.video_id })
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setExtractionStatus('success');
      setExtractionMessage(`Knowledge extraction complete! ${successCount} succeeded, ${failCount} failed. Keywords now appear below - scroll down to review and approve them.`);

      // Reload keywords
      await loadExtractedKeywords();

      setTimeout(() => setExtractionMessage(''), 8000);
    } catch (error: any) {
      setExtractionStatus('error');
      setExtractionMessage(error.message || 'Knowledge extraction failed');
      setTimeout(() => setExtractionMessage(''), 8000);
    } finally {
      setExtracting(false);
    }
  }

  function saveKeywords() {
    const approved = keywords.filter(k => k.status === 'approved');
    console.log('Saving approved keywords:', approved);
    alert(`✅ Saved ${approved.length} approved keywords to database`);
  }

  const filteredKeywords = keywords.filter(k => {
    // Filter by confidence
    if (keywordFilter === 'high' && k.confidence < 0.8) return false;
    if (keywordFilter === 'medium' && (k.confidence < 0.5 || k.confidence >= 0.8)) return false;
    if (keywordFilter === 'low' && k.confidence >= 0.5) return false;

    // Filter by search
    if (keywordSearch && !k.keyword.toLowerCase().includes(keywordSearch.toLowerCase())) {
      return false;
    }

    return true;
  });

  // ============================================================================
  // SCRIPT PREDICTOR FUNCTIONS
  // ============================================================================

  async function predictScript() {
    if (!scriptText || scriptText.length < 50) {
      alert('Please enter a script with at least 50 characters');
      return;
    }

    try {
      setPredicting(true);

      const requestBody: PreContentPredictionRequest = {
        script: scriptText,
        niche: scriptNiche,
        platform: scriptPlatform,
        creatorFollowers: 10000, // Default
      };

      const response = await fetch('/api/predict/pre-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data: PreContentPredictionResponse = await response.json();

      if (!response.ok) {
        throw new Error((data as any).message || 'Prediction failed');
      }

      setPredictionResult(data);
      setPredicting(false);
    } catch (error: any) {
      console.error('Prediction error:', error);
      alert(`Prediction failed: ${error.message}`);
      setPredicting(false);
    }
  }

  function clearScript() {
    setScriptText('');
    setPredictionResult(null);
  }

  function getTierColor(tier: ViralTier): string {
    switch (tier) {
      case 'mega_viral': return 'from-pink-500 to-red-500';
      case 'hyper_viral': return 'from-orange-500 to-pink-500';
      case 'viral': return 'from-yellow-500 to-orange-500';
      case 'strong': return 'from-green-500 to-yellow-500';
      default: return 'from-gray-500 to-blue-500';
    }
  }

  function getTierLabel(tier: ViralTier): string {
    switch (tier) {
      case 'mega_viral': return 'MEGA VIRAL';
      case 'hyper_viral': return 'HYPER VIRAL';
      case 'viral': return 'VIRAL';
      case 'strong': return 'STRONG';
      default: return 'AVERAGE';
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F0A1E] via-black to-[#1a0b2e] text-white">
      {/* ====== HEADER ====== */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
                SCRIPT INTELLIGENCE
              </h1>
              <p className="text-gray-400 text-lg">
                FEAT-060 Knowledge Extraction + FEAT-070 Pre-Content Prediction
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 font-mono">ADMIN / RESEARCH-REVIEW</div>
              <div className="text-xs text-purple-400 font-mono mt-1">
                {activeTab === 'keywords' ? 'KEYWORD RESEARCH' : 'SCRIPT PREDICTOR'}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('keywords')}
              className={`
                px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300
                ${activeTab === 'keywords'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }
              `}
            >
              🔍 KEYWORD RESEARCH
              {keywordStats.total > 0 && (
                <span className="ml-2 text-sm opacity-75">({keywordStats.total})</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('predictor')}
              className={`
                px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300
                ${activeTab === 'predictor'
                  ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }
              `}
            >
              🎯 SCRIPT PREDICTOR
            </button>
          </div>
        </div>
      </div>

      {/* ====== KEYWORD RESEARCH TAB ====== */}
      {activeTab === 'keywords' && (
        <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-8">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-6">
            {/* Total Keywords */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                  {keywordStats.total}
                </div>
                <div className="text-lg font-semibold text-gray-300 mb-1">TOTAL KEYWORDS</div>
                <div className="text-xs text-purple-400 font-mono">
                  FEAT-060: extracted_knowledge
                </div>
              </div>
            </div>

            {/* High Confidence */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                  {keywordStats.highConfidence}
                </div>
                <div className="text-lg font-semibold text-gray-300 mb-1">HIGH CONFIDENCE</div>
                <div className="text-xs text-green-400 font-mono">
                  confidence ≥ 0.8
                </div>
              </div>
            </div>

            {/* Medium Confidence */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                  {keywordStats.mediumConfidence}
                </div>
                <div className="text-lg font-semibold text-gray-300 mb-1">MEDIUM CONFIDENCE</div>
                <div className="text-xs text-yellow-400 font-mono">
                  0.5 ≤ confidence &lt; 0.8
                </div>
              </div>
            </div>

            {/* Low Confidence */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-5xl font-bold bg-gradient-to-r from-gray-400 to-slate-400 bg-clip-text text-transparent mb-2">
                  {keywordStats.lowConfidence}
                </div>
                <div className="text-lg font-semibold text-gray-300 mb-1">LOW CONFIDENCE</div>
                <div className="text-xs text-gray-400 font-mono">
                  confidence &lt; 0.5
                </div>
              </div>
            </div>
          </div>

          {/* Sources Breakdown */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
            <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-purple-300">📊 SOURCES BREAKDOWN</h3>
                <button
                  onClick={runKnowledgeExtraction}
                  disabled={extracting}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 rounded-xl font-semibold transition-all shadow-lg shadow-green-500/30"
                >
                  {extracting ? '⏳ Extracting...' : '🧠 Run Knowledge Extraction'}
                </button>
              </div>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400">{keywordStats.sources.gpt4}</div>
                  <div className="text-sm text-gray-400 mt-1">GPT-4</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">{keywordStats.sources.claude}</div>
                  <div className="text-sm text-gray-400 mt-1">Claude</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-400">{keywordStats.sources.gemini}</div>
                  <div className="text-sm text-gray-400 mt-1">Gemini</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">{keywordStats.sources.patterns}</div>
                  <div className="text-sm text-gray-400 mt-1">Patterns</div>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-400 text-center">
                FEAT-060: Analyzes transcripts with 3 LLMs to extract hooks, keywords, and triggers
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setKeywordFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  keywordFilter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                All ({keywordStats.total})
              </button>
              <button
                onClick={() => setKeywordFilter('high')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  keywordFilter === 'high'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                High ({keywordStats.highConfidence})
              </button>
              <button
                onClick={() => setKeywordFilter('medium')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  keywordFilter === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                Medium ({keywordStats.mediumConfidence})
              </button>
              <button
                onClick={() => setKeywordFilter('low')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  keywordFilter === 'low'
                    ? 'bg-gray-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                }`}
              >
                Low ({keywordStats.lowConfidence})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search keywords..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Keyword Pills */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-2xl blur-xl"></div>
            <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10 min-h-[400px] max-h-[600px] overflow-y-auto">
              {loadingKeywords ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-4xl mb-4">⏳</div>
                  <div>Loading keywords from FEAT-060...</div>
                </div>
              ) : filteredKeywords.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="text-4xl mb-4">🔍</div>
                  <div>No keywords found matching your filters</div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {filteredKeywords.map((kw, idx) => {
                    const isSelected = selectedKeywords.has(kw.keyword);
                    const isApproved = kw.status === 'approved';
                    const isRejected = kw.status === 'rejected';

                    return (
                      <div
                        key={idx}
                        className={`
                          group relative px-4 py-3 rounded-lg border transition-all cursor-pointer
                          ${isApproved
                            ? 'bg-green-500/20 border-green-500/50 text-green-300'
                            : isRejected
                            ? 'bg-red-500/20 border-red-500/50 text-red-300 opacity-50'
                            : isSelected
                            ? 'bg-purple-500/30 border-purple-500 text-purple-200'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }
                        `}
                        onClick={() => toggleKeywordSelection(kw.keyword)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-semibold">{kw.keyword}</div>
                          <div className="text-xs opacity-75">
                            {(kw.confidence * 100).toFixed(0)}%
                          </div>
                          {kw.category && (
                            <div className="text-xs px-2 py-0.5 rounded bg-black/30">
                              {kw.category}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleKeywordStatus(kw.keyword, 'approved');
                            }}
                            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                              isApproved
                                ? 'bg-green-600 text-white'
                                : 'bg-white/10 text-gray-400 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleKeywordStatus(kw.keyword, 'rejected');
                            }}
                            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                              isRejected
                                ? 'bg-red-600 text-white'
                                : 'bg-white/10 text-gray-400 hover:bg-red-600 hover:text-white'
                            }`}
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedKeywords.size > 0 && (
            <div className="flex gap-4 items-center justify-between backdrop-blur-xl bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="text-purple-300 font-semibold">
                {selectedKeywords.size} keywords selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={bulkApprove}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-all"
                >
                  ✓ Approve Selected
                </button>
                <button
                  onClick={bulkReject}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
                >
                  ✗ Reject Selected
                </button>
                <button
                  onClick={() => setSelectedKeywords(new Set())}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-all"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-black via-black/80 to-transparent">
            <button
              onClick={saveKeywords}
              disabled={keywords.filter(k => k.status === 'approved').length === 0}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 rounded-xl font-bold text-lg shadow-lg transition-all"
            >
              💾 SAVE CHANGES ({keywords.filter(k => k.status === 'approved').length} approved)
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Toast Notification */}
      {extractionMessage && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl backdrop-blur-xl border shadow-2xl max-w-md z-50 ${
          extractionStatus === 'success' ? 'bg-green-500/20 border-green-500/50' :
          extractionStatus === 'error' ? 'bg-red-500/20 border-red-500/50' :
          extractionStatus === 'loading' ? 'bg-blue-500/20 border-blue-500/50 animate-pulse' :
          'bg-white/10 border-white/20'
        }`}>
          <div className="flex items-start gap-3">
            <div className="text-2xl flex-shrink-0">
              {extractionStatus === 'success' ? '✅' :
               extractionStatus === 'error' ? '❌' :
               extractionStatus === 'loading' ? '⏳' : 'ℹ️'}
            </div>
            <div className="flex-1">
              <div className={`font-semibold text-sm mb-1 ${
                extractionStatus === 'success' ? 'text-green-300' :
                extractionStatus === 'error' ? 'text-red-300' :
                extractionStatus === 'loading' ? 'text-blue-300' :
                'text-white'
              }`}>
                {extractionStatus === 'success' ? 'Success!' :
                 extractionStatus === 'error' ? 'Error' :
                 extractionStatus === 'loading' ? 'Processing...' : 'Info'}
              </div>
              <div className="text-white text-sm">{extractionMessage}</div>
            </div>
            {!extracting && (
              <button
                onClick={() => setExtractionMessage('')}
                className="text-white/60 hover:text-white transition-colors flex-shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ====== SCRIPT PREDICTOR TAB ====== */}
      {activeTab === 'predictor' && (
        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
          {!predictionResult ? (
            /* INPUT FORM STATE */
            <div className="space-y-6">
              {/* Script Input */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-2xl blur-xl"></div>
                <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <label className="block text-lg font-bold mb-3 text-cyan-300">
                    📝 ENTER YOUR SCRIPT
                  </label>
                  <textarea
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                    placeholder="Paste your TikTok script here (minimum 50 characters)..."
                    className="w-full h-64 px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none font-mono text-sm"
                    maxLength={5000}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="text-sm text-gray-400">
                      {scriptText.length} / 5000 characters
                      {scriptText.length < 50 && (
                        <span className="ml-2 text-yellow-400">
                          (minimum 50 characters)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-cyan-400 font-mono">
                      FEAT-070: Pre-Content Prediction API
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-2 gap-6">
                {/* Niche Selection */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <label className="block text-lg font-bold mb-3 text-purple-300">
                      🎯 NICHE
                    </label>
                    <select
                      value={scriptNiche}
                      onChange={(e) => setScriptNiche(e.target.value)}
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="general">General</option>
                      <option value="fitness">Fitness</option>
                      <option value="finance">Finance</option>
                      <option value="tech">Tech</option>
                      <option value="beauty">Beauty</option>
                      <option value="comedy">Comedy</option>
                      <option value="education">Education</option>
                    </select>
                  </div>
                </div>

                {/* Platform Selection */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <label className="block text-lg font-bold mb-3 text-pink-300">
                      📱 PLATFORM
                    </label>
                    <select
                      value={scriptPlatform}
                      onChange={(e) => setScriptPlatform(e.target.value as any)}
                      className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram Reels</option>
                      <option value="youtube">YouTube Shorts</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={clearScript}
                  disabled={!scriptText}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all"
                >
                  🗑️ CLEAR
                </button>
                <button
                  onClick={predictScript}
                  disabled={scriptText.length < 50 || predicting}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 disabled:from-gray-600 disabled:to-gray-700 disabled:opacity-50 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all"
                >
                  {predicting ? '⏳ ANALYZING...' : '🎯 PREDICT VIRAL POTENTIAL'}
                </button>
              </div>
            </div>
          ) : (
            /* RESULTS STATE */
            <div className="space-y-6">
              {/* Hero Score Display */}
              <div className="relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${getTierColor(predictionResult.predictedTier)}/20 rounded-3xl blur-2xl`}></div>
                <div className="relative backdrop-blur-xl bg-white/5 rounded-3xl p-12 border border-white/10 text-center">
                  <div className="text-sm font-bold text-gray-400 mb-2 tracking-widest">PREDICTED TIER</div>
                  <div className={`text-8xl font-black bg-gradient-to-r ${getTierColor(predictionResult.predictedTier)} bg-clip-text text-transparent mb-4`}>
                    {getTierLabel(predictionResult.predictedTier)}
                  </div>
                  <div className="text-2xl text-gray-300 mb-6">
                    {(predictionResult.confidence * 100).toFixed(1)}% confidence
                  </div>

                  {/* Confidence Bar */}
                  <div className="max-w-md mx-auto mb-6">
                    <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${getTierColor(predictionResult.predictedTier)} transition-all duration-1000`}
                        style={{ width: `${predictionResult.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 font-mono">
                    FEAT-070: /api/predict/pre-content
                  </div>
                </div>
              </div>

              {/* Tier Probabilities */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl"></div>
                <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold mb-4 text-purple-300">📊 TIER PROBABILITIES</h3>
                  <div className="space-y-3">
                    {(Object.entries(predictionResult.tierProbabilities) as [ViralTier, number][]).map(([tier, prob]) => (
                      <div key={tier} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-semibold text-gray-300">
                          {getTierLabel(tier)}
                        </div>
                        <div className="flex-1 h-8 bg-black/50 rounded-lg overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getTierColor(tier)} transition-all duration-500`}
                            style={{ width: `${prob * 100}%` }}
                          />
                        </div>
                        <div className="w-16 text-right text-sm font-bold text-gray-300">
                          {(prob * 100).toFixed(1)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Predictions Grid */}
              <div className="grid grid-cols-3 gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="text-sm text-gray-400 mb-2">ESTIMATED VIEWS</div>
                    <div className="text-3xl font-bold text-cyan-400">{predictionResult.predictions.estimatedViews}</div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="text-sm text-gray-400 mb-2">ESTIMATED LIKES</div>
                    <div className="text-3xl font-bold text-pink-400">{predictionResult.predictions.estimatedLikes}</div>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="text-sm text-gray-400 mb-2">DPS PERCENTILE</div>
                    <div className="text-3xl font-bold text-purple-400">{predictionResult.predictions.estimatedDPSPercentile}</div>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl blur-xl"></div>
                <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold mb-4 text-orange-300">🔬 SCORE BREAKDOWN</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-400 mb-2">Pattern Match Score</div>
                      <div className="text-4xl font-bold text-yellow-400">{predictionResult.breakdown.patternMatchScore.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 mt-1">FEAT-003 viral patterns</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-2">LLM Consensus Score</div>
                      <div className="text-4xl font-bold text-orange-400">{predictionResult.breakdown.llmConsensusScore.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        GPT: {predictionResult.breakdown.llmScores.gpt4?.toFixed(0) || 'N/A'}
                        {' • '}Claude: {predictionResult.breakdown.llmScores.claude?.toFixed(0) || 'N/A'}
                        {' • '}Gemini: {predictionResult.breakdown.llmScores.gemini?.toFixed(0) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
                <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold mb-4 text-green-300">💡 RECOMMENDATIONS</h3>
                  <ul className="space-y-3">
                    {predictionResult.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-300">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Top Matching Patterns */}
              {predictionResult.topMatchingPatterns.length > 0 && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold mb-4 text-purple-300">🎯 TOP MATCHING PATTERNS</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {predictionResult.topMatchingPatterns.slice(0, 3).map((pattern, idx) => (
                        <div key={idx} className="bg-black/50 rounded-lg p-4 border border-white/10">
                          <div className="text-sm text-gray-400 mb-1">{pattern.type}</div>
                          <div className="font-semibold text-white mb-2">{pattern.description}</div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-400">{(pattern.successRate * 100).toFixed(0)}% success</span>
                            <span className="text-purple-400">DPS: {pattern.avgDPS.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setPredictionResult(null)}
                  className="flex-1 px-8 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-lg transition-all"
                >
                  ← BACK TO INPUT
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(predictionResult, null, 2));
                    alert('Results copied to clipboard!');
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold text-lg transition-all"
                >
                  📋 COPY RESULTS
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
