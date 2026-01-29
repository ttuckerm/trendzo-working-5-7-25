'use client';

import React, { useState } from 'react';
import { 
  FlaskConical, Play, CheckCircle, XCircle, AlertTriangle,
  TrendingUp, TrendingDown, Target, Zap, RefreshCw, Settings,
  BarChart3, Activity, Download, Upload, Sparkles
} from 'lucide-react';

// Sample transcripts with KNOWN expected scores
const CALIBRATION_SAMPLES = [
  {
    id: 'good_viral',
    name: 'Good Viral Content',
    expectedDPS: { min: 75, max: 95 },
    transcript: `Here's something nobody talks about. I spent 3 years studying why some videos get millions of views while others flop. The answer? It's not luck. It's not the algorithm. It's this one thing that 99% of creators miss. Ready? It's the first 3 seconds. That's it. Your hook determines everything. Let me show you exactly how to nail it every single time...`,
    characteristics: ['strong_hook', 'curiosity_gap', 'specific_promise', 'authority', 'clear_value']
  },
  {
    id: 'bad_boring',
    name: 'Bad Boring Content', 
    expectedDPS: { min: 15, max: 35 },
    transcript: `So today I wanted to talk about something. Um, I've been thinking about this for a while. Basically, there's this thing that I noticed. It's kind of interesting I guess. Anyway, let me explain. So basically what happens is, you know, things just kind of work out sometimes. And yeah, that's pretty much it. Hope you found this helpful.`,
    characteristics: ['weak_hook', 'filler_words', 'no_value', 'no_structure', 'vague']
  },
  {
    id: 'medium_decent',
    name: 'Medium Decent Content',
    expectedDPS: { min: 45, max: 60 },
    transcript: `3 tips for better productivity. First, wake up early. Studies show early risers are more productive. Second, make a to-do list. It helps you stay organized. Third, take breaks. Your brain needs rest. Try these and let me know how it goes in the comments.`,
    characteristics: ['basic_hook', 'list_format', 'generic_advice', 'call_to_action', 'no_story']
  },
  {
    id: 'hooks_strong',
    name: 'Strong Hooks Content',
    expectedDPS: { min: 70, max: 90 },
    transcript: `STOP scrolling. This changed my life. I was broke, depressed, and about to give up. Then I discovered this one weird trick that billionaires use every morning. Within 30 days, everything changed. I went from $0 to $10K per month. Here's exactly what I did, step by step...`,
    characteristics: ['pattern_interrupt', 'transformation_story', 'specific_results', 'curiosity', 'step_by_step']
  },
  {
    id: 'no_hook',
    name: 'No Hook Content',
    expectedDPS: { min: 10, max: 30 },
    transcript: `Hey guys, welcome back to my channel. So in today's video we're going to be talking about some stuff. I've been doing this for a while now and I thought I'd share. Basically it's just some thoughts I had. Nothing too crazy. Anyway, let's get into it I guess.`,
    characteristics: ['no_hook', 'generic_intro', 'no_promise', 'low_energy', 'no_value_prop']
  }
];

interface ComponentResult {
  componentId: string;
  componentName: string;
  score: number;
  calibratedScore: number;
  latency: number;
  status: 'pass' | 'fail' | 'warning';
  expectedRange?: { min: number; max: number };
}

interface NegativeSignal {
  id: string;
  name: string;
  description: string;
  detected: boolean;
  evidence: string[];
  penalty: number;
}

interface PositiveSignal {
  id: string;
  name: string;
  detected: boolean;
  evidence: string[];
  bonus: number;
}

interface DiagnosticResult {
  sampleId: string;
  sampleName: string;
  expectedDPS: { min: number; max: number };
  predictedDPS: number;
  calibratedDPS: number;
  status: 'pass' | 'fail' | 'warning';
  error: number;
  componentResults: ComponentResult[];
  negativeSignals: NegativeSignal[];
  positiveSignals: PositiveSignal[];
  totalPenalty: number;
  totalBonus: number;
  netAdjustment: number;
  timestamp: string;
}

interface DiagnosisResult {
  summary: {
    avgError: number;
    avgCalibratedError: number;
    systematicBias: number;
    passRate: number;
    failRate: number;
  };
  inflatedComponents: { id: string; avgScore: number; avgCalibratedScore: number; consistency: number }[];
  recommendations: string[];
  overallHealth: 'healthy' | 'warning' | 'critical';
}

export default function CalibrationPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSample, setCurrentSample] = useState<string | null>(null);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'calibration' | 'history'>('diagnostic');
  const [calibrationConfigs, setCalibrationConfigs] = useState<Record<string, any>>({});

  const runDiagnostic = async (sample: typeof CALIBRATION_SAMPLES[0]) => {
    setCurrentSample(sample.id);
    
    try {
      const response = await fetch('/api/calibration/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: sample.transcript,
          expectedDPS: sample.expectedDPS,
          sampleId: sample.id,
          characteristics: sample.characteristics
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Diagnostic failed');
      }
      
      // Determine status based on whether prediction is within expected range
      const predicted = data.calibratedDPS || data.predictedDPS;
      const { min, max } = sample.expectedDPS;
      let status: 'pass' | 'fail' | 'warning' = 'pass';
      
      if (predicted < min - 10 || predicted > max + 10) {
        status = 'fail';
      } else if (predicted < min || predicted > max) {
        status = 'warning';
      }
      
      const result: DiagnosticResult = {
        sampleId: sample.id,
        sampleName: sample.name,
        expectedDPS: sample.expectedDPS,
        predictedDPS: data.predictedDPS,
        calibratedDPS: data.calibratedDPS,
        status,
        error: predicted - ((min + max) / 2),
        componentResults: data.componentResults,
        negativeSignals: data.negativeSignals || [],
        positiveSignals: data.positiveSignals || [],
        totalPenalty: data.totalPenalty || 0,
        totalBonus: data.totalBonus || 0,
        netAdjustment: data.netAdjustment || 0,
        timestamp: new Date().toISOString()
      };
      
      setResults(prev => [...prev, result]);
      return result;
    } catch (error) {
      console.error('Diagnostic failed:', error);
      return null;
    }
  };

  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setDiagnosis(null);
    
    const allResults: DiagnosticResult[] = [];
    
    for (const sample of CALIBRATION_SAMPLES) {
      const result = await runDiagnostic(sample);
      if (result) allResults.push(result);
      // Small delay between tests
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Generate diagnosis
    const diagnosisResult = analyzeDiagnosticResults(allResults);
    setDiagnosis(diagnosisResult);
    
    setCurrentSample(null);
    setIsRunning(false);
  };

  const analyzeDiagnosticResults = (results: DiagnosticResult[]): DiagnosisResult => {
    // Calculate overall metrics
    const totalError = results.reduce((sum, r) => sum + Math.abs(r.error), 0);
    const avgError = totalError / results.length;
    
    const totalCalibratedError = results.reduce((sum, r) => {
      const expected = (r.expectedDPS.min + r.expectedDPS.max) / 2;
      return sum + Math.abs(r.calibratedDPS - expected);
    }, 0);
    const avgCalibratedError = totalCalibratedError / results.length;
    
    const passCount = results.filter(r => r.status === 'pass').length;
    const failCount = results.filter(r => r.status === 'fail').length;
    
    // Check for systematic bias
    const avgPrediction = results.reduce((sum, r) => sum + r.calibratedDPS, 0) / results.length;
    const avgExpected = results.reduce((sum, r) => sum + (r.expectedDPS.min + r.expectedDPS.max) / 2, 0) / results.length;
    const systematicBias = avgPrediction - avgExpected;
    
    // Identify problematic components
    const componentErrors: Record<string, { raw: number[]; calibrated: number[] }> = {};
    results.forEach(r => {
      r.componentResults.forEach(cr => {
        if (!componentErrors[cr.componentId]) {
          componentErrors[cr.componentId] = { raw: [], calibrated: [] };
        }
        componentErrors[cr.componentId].raw.push(cr.score);
        componentErrors[cr.componentId].calibrated.push(cr.calibratedScore);
      });
    });
    
    // Find components that are consistently high
    const inflatedComponents = Object.entries(componentErrors)
      .map(([id, scores]) => ({
        id,
        avgScore: scores.raw.reduce((a, b) => a + b, 0) / scores.raw.length,
        avgCalibratedScore: scores.calibrated.reduce((a, b) => a + b, 0) / scores.calibrated.length,
        consistency: Math.max(...scores.raw) - Math.min(...scores.raw)
      }))
      .filter(c => c.avgScore > 70)
      .sort((a, b) => b.avgScore - a.avgScore);

    // Generate specific recommendations
    const recommendations: string[] = [];
    
    if (systematicBias > 15) {
      recommendations.push(`CRITICAL: System has +${systematicBias.toFixed(1)} DPS systematic over-prediction bias`);
    } else if (systematicBias > 5) {
      recommendations.push(`WARNING: System has +${systematicBias.toFixed(1)} DPS over-prediction bias`);
    } else if (systematicBias < -15) {
      recommendations.push(`CRITICAL: System has ${systematicBias.toFixed(1)} DPS under-prediction bias`);
    } else if (systematicBias < -5) {
      recommendations.push(`WARNING: System has ${systematicBias.toFixed(1)} DPS under-prediction bias`);
    } else {
      recommendations.push(`✓ Good: Systematic bias is within ±5 DPS (${systematicBias > 0 ? '+' : ''}${systematicBias.toFixed(1)} DPS)`);
    }
    
    if (inflatedComponents.length > 0) {
      recommendations.push(`${inflatedComponents.length} components are consistently scoring above 70 DPS (raw)`);
      inflatedComponents.forEach(c => {
        const reduction = c.avgScore - c.avgCalibratedScore;
        recommendations.push(`  • ${c.id}: raw ${c.avgScore.toFixed(1)} → calibrated ${c.avgCalibratedScore.toFixed(1)} (−${reduction.toFixed(1)})`);
      });
    }
    
    // Check if bad content is being scored too high
    const badContentResult = results.find(r => r.sampleId === 'bad_boring');
    if (badContentResult && badContentResult.calibratedDPS > 45) {
      recommendations.push(`CRITICAL: Bad content scored ${badContentResult.calibratedDPS.toFixed(1)} DPS (should be 15-35)`);
      recommendations.push(`  → System cannot distinguish bad content from good`);
    } else if (badContentResult && badContentResult.calibratedDPS <= 35) {
      recommendations.push(`✓ Good: Bad content correctly scored ${badContentResult.calibratedDPS.toFixed(1)} DPS`);
    }
    
    // Check if good content is being scored appropriately
    const goodContentResult = results.find(r => r.sampleId === 'good_viral');
    if (goodContentResult) {
      if (goodContentResult.calibratedDPS > 95) {
        recommendations.push(`WARNING: Good content scored ${goodContentResult.calibratedDPS.toFixed(1)} DPS (ceiling too high)`);
      } else if (goodContentResult.calibratedDPS >= 75 && goodContentResult.calibratedDPS <= 95) {
        recommendations.push(`✓ Good: Viral content correctly scored ${goodContentResult.calibratedDPS.toFixed(1)} DPS`);
      } else if (goodContentResult.calibratedDPS < 75) {
        recommendations.push(`WARNING: Good content under-scored at ${goodContentResult.calibratedDPS.toFixed(1)} DPS (should be 75-95)`);
      }
    }

    // Calibration effectiveness
    if (avgCalibratedError < avgError) {
      recommendations.push(`✓ Calibration reduced error by ${(avgError - avgCalibratedError).toFixed(1)} DPS`);
    }

    return {
      summary: {
        avgError,
        avgCalibratedError,
        systematicBias,
        passRate: (passCount / results.length) * 100,
        failRate: (failCount / results.length) * 100
      },
      inflatedComponents,
      recommendations,
      overallHealth: failCount === 0 ? 'healthy' : failCount <= 2 ? 'warning' : 'critical'
    };
  };

  const loadCalibrationConfigs = async () => {
    try {
      const response = await fetch('/api/calibration/configs');
      const data = await response.json();
      if (data.success) {
        setCalibrationConfigs(data.configs);
      }
    } catch (error) {
      console.error('Failed to load calibration configs:', error);
    }
  };

  const exportResults = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      results,
      diagnosis,
      calibrationConfigs
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calibration-diagnostic-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FlaskConical className="text-purple-500" />
              Prediction Calibration Lab
            </h1>
            <p className="text-gray-400 mt-1">
              Diagnose and fix prediction accuracy issues • Target: &lt;10 DPS error
            </p>
          </div>
          <div className="flex items-center gap-3">
            {results.length > 0 && (
              <button
                onClick={exportResults}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
            )}
            <button
              onClick={runFullDiagnostic}
              disabled={isRunning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning 
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Running Diagnostic...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Run Full Diagnostic
                </>
              )}
        </button>
      </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800 pb-2">
          {[
            { id: 'diagnostic', label: 'Diagnostic', icon: Activity },
            { id: 'calibration', label: 'Calibration Config', icon: Settings },
            { id: 'history', label: 'History', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'diagnostic' && (
          <>
            {/* Sample Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              {CALIBRATION_SAMPLES.map(sample => {
                const result = results.find(r => r.sampleId === sample.id);
                const isCurrentlyRunning = currentSample === sample.id;
                
                return (
                  <div 
                    key={sample.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentlyRunning 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : result
                          ? result.status === 'pass'
                            ? 'border-green-500/50 bg-green-500/10'
                            : result.status === 'warning'
                              ? 'border-yellow-500/50 bg-yellow-500/10'
                              : 'border-red-500/50 bg-red-500/10'
                          : 'border-gray-800 bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{sample.name}</span>
                      {isCurrentlyRunning && <RefreshCw className="animate-spin text-purple-500" size={14} />}
                      {result && (
                        result.status === 'pass' 
                          ? <CheckCircle className="text-green-500" size={14} />
                          : result.status === 'warning'
                            ? <AlertTriangle className="text-yellow-500" size={14} />
                            : <XCircle className="text-red-500" size={14} />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-2">
                      Expected: {sample.expectedDPS.min}-{sample.expectedDPS.max} DPS
                    </div>
                    {result && (
                      <>
                        <div className="text-xs text-gray-600 mb-1">
                          Raw: {result.predictedDPS.toFixed(1)} DPS
                        </div>
                        <div className={`text-lg font-bold ${
                          result.status === 'pass' ? 'text-green-400' :
                          result.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {result.calibratedDPS.toFixed(1)} DPS
                          <span className="text-xs ml-2 font-normal">
                            ({result.error > 0 ? '+' : ''}{result.error.toFixed(1)})
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1 text-xs">
                          {result.totalBonus > 0 && (
                            <span className="text-green-400">+{result.totalBonus}</span>
                          )}
                          {result.totalPenalty > 0 && (
                            <span className="text-red-400">−{result.totalPenalty}</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Diagnosis Results */}
            {diagnosis && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-5 gap-4">
                  <div className={`p-4 rounded-xl ${
                    diagnosis.summary.avgCalibratedError < 10 ? 'bg-green-500/20 border border-green-500/50' :
                    diagnosis.summary.avgCalibratedError < 20 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                    'bg-red-500/20 border border-red-500/50'
                  }`}>
                    <div className="text-sm text-gray-400">Calibrated Error</div>
                    <div className="text-2xl font-bold">{diagnosis.summary.avgCalibratedError.toFixed(1)} DPS</div>
                    <div className="text-xs text-gray-500">Target: &lt;10 DPS</div>
                  </div>

                  <div className={`p-4 rounded-xl ${
                    diagnosis.summary.avgError < 15 ? 'bg-green-500/20 border border-green-500/50' :
                    diagnosis.summary.avgError < 25 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                    'bg-red-500/20 border border-red-500/50'
                  }`}>
                    <div className="text-sm text-gray-400">Raw Error</div>
                    <div className="text-2xl font-bold">{diagnosis.summary.avgError.toFixed(1)} DPS</div>
                    <div className="text-xs text-gray-500">Before calibration</div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${
                    Math.abs(diagnosis.summary.systematicBias) < 5 ? 'bg-green-500/20 border border-green-500/50' :
                    Math.abs(diagnosis.summary.systematicBias) < 15 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                    'bg-red-500/20 border border-red-500/50'
                  }`}>
                    <div className="text-sm text-gray-400">Systematic Bias</div>
                    <div className="text-2xl font-bold">
                      {diagnosis.summary.systematicBias > 0 ? '+' : ''}{diagnosis.summary.systematicBias.toFixed(1)} DPS
                    </div>
                    <div className="text-xs text-gray-500">
                      {diagnosis.summary.systematicBias > 0 ? 'Over-predicting' : diagnosis.summary.systematicBias < 0 ? 'Under-predicting' : 'Balanced'}
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${
                    diagnosis.summary.passRate >= 80 ? 'bg-green-500/20 border border-green-500/50' :
                    diagnosis.summary.passRate >= 60 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                    'bg-red-500/20 border border-red-500/50'
                  }`}>
                    <div className="text-sm text-gray-400">Pass Rate</div>
                    <div className="text-2xl font-bold">{diagnosis.summary.passRate.toFixed(0)}%</div>
                    <div className="text-xs text-gray-500">Target: &gt;80%</div>
                  </div>
                  
                  <div className={`p-4 rounded-xl ${
                    diagnosis.overallHealth === 'healthy' ? 'bg-green-500/20 border border-green-500/50' :
                    diagnosis.overallHealth === 'warning' ? 'bg-yellow-500/20 border border-yellow-500/50' :
                    'bg-red-500/20 border border-red-500/50'
                  }`}>
                    <div className="text-sm text-gray-400">System Health</div>
                    <div className="text-2xl font-bold capitalize">{diagnosis.overallHealth}</div>
                    <div className="text-xs text-gray-500">
                      {diagnosis.inflatedComponents.length} need calibration
                    </div>
                  </div>
                </div>

                {/* Inflated Components */}
                {diagnosis.inflatedComponents.length > 0 && (
                  <div className="bg-orange-500/10 border border-orange-500/50 rounded-xl p-4">
                    <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
                      <TrendingUp size={18} />
                      Components With High Raw Scores (Pre-Calibration)
                    </h3>
                    <div className="space-y-2">
                      {diagnosis.inflatedComponents.map((comp) => (
                        <div key={comp.id} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                          <span className="font-medium">{comp.id}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-orange-400">Raw: {comp.avgScore.toFixed(1)} DPS</span>
                            <span className="text-green-400">→ Calibrated: {comp.avgCalibratedScore.toFixed(1)} DPS</span>
                            <span className="text-gray-500">Variance: ±{(comp.consistency/2).toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Target size={18} className="text-purple-500" />
                    Diagnostic Recommendations
                  </h3>
                  <div className="space-y-2">
                    {diagnosis.recommendations.map((rec, i) => (
                      <div key={i} className={`p-3 rounded-lg ${
                        rec.startsWith('CRITICAL') ? 'bg-red-500/20 text-red-300' :
                        rec.startsWith('WARNING') ? 'bg-yellow-500/20 text-yellow-300' :
                        rec.startsWith('✓') ? 'bg-green-500/20 text-green-300' :
                        rec.startsWith('  ') ? 'bg-gray-800 text-gray-300 ml-4' :
                        'bg-gray-800 text-gray-300'
                      }`}>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Results Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="font-bold">Detailed Component Results</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Sample</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">XGBoost</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">GPT-4</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Pattern</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Historical</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Gemini</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Signals</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Final</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Expected</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Error</th>
            </tr>
          </thead>
                      <tbody className="divide-y divide-gray-800">
                        {results.map(result => (
                          <tr key={result.sampleId} className="hover:bg-gray-800/50">
                            <td className="px-4 py-3 font-medium">{result.sampleName}</td>
                            {['xgboost', 'gpt4', 'pattern', 'historical', 'gemini'].map(compId => {
                              const comp = result.componentResults.find(c => c.componentId === compId);
                              const rawScore = comp?.score || 0;
                              const calibratedScore = comp?.calibratedScore || 0;
                              return (
                                <td key={compId} className="px-4 py-3">
                                  <div className={`text-xs ${rawScore > 80 ? 'text-red-400' : rawScore > 60 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                    {rawScore.toFixed(0)}
                                  </div>
                                  <div className={`font-medium ${
                                    calibratedScore > 70 ? 'text-green-400' :
                                    calibratedScore > 40 ? 'text-yellow-400' :
                                    'text-red-400'
                                  }`}>
                                    {calibratedScore.toFixed(1)}
                                  </div>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                {result.totalBonus > 0 && (
                                  <span className="text-xs text-green-400">+{result.totalBonus}</span>
                                )}
                                {result.totalPenalty > 0 && (
                                  <span className="text-xs text-red-400">−{result.totalPenalty}</span>
                                )}
                                {result.totalBonus === 0 && result.totalPenalty === 0 && (
                                  <span className="text-xs text-gray-500">—</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold">{result.calibratedDPS.toFixed(1)}</td>
                            <td className="px-4 py-3 text-gray-400">
                              {result.expectedDPS.min}-{result.expectedDPS.max}
                            </td>
                            <td className={`px-4 py-3 font-bold ${
                              Math.abs(result.error) < 10 ? 'text-green-400' :
                              Math.abs(result.error) < 20 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {result.error > 0 ? '+' : ''}{result.error.toFixed(1)}
                            </td>
              </tr>
            ))}
          </tbody>
        </table>
                  </div>
                </div>

                {/* Positive Signals Section */}
                {results.some(r => r.positiveSignals && r.positiveSignals.length > 0) && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-green-400">
                      <Sparkles size={18} />
                      Positive Signals Detected
                    </h3>
                    <div className="space-y-4">
                      {results.map(result => (
                        <div key={result.sampleId} className="border-b border-gray-800 pb-3 last:border-0">
                          <div className="font-medium mb-2">{result.sampleName}</div>
                          <div className="flex flex-wrap gap-2">
                            {result.positiveSignals && result.positiveSignals.length > 0 ? (
                              result.positiveSignals.map((signal: PositiveSignal) => (
                                <span 
                                  key={signal.id}
                                  className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full"
                                >
                                  {signal.name} (+{signal.bonus})
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No positive signals detected</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Negative Signals */}
                {results.some(r => r.negativeSignals.length > 0) && (
                  <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <AlertTriangle size={18} className="text-red-500" />
                      Negative Signals Detected
                    </h3>
                    <div className="space-y-4">
                      {results.filter(r => r.negativeSignals.length > 0).map(result => (
                        <div key={result.sampleId} className="bg-gray-800/50 rounded-lg p-3">
                          <div className="font-medium text-white mb-2">{result.sampleName}</div>
                          <div className="flex flex-wrap gap-2">
                            {result.negativeSignals.filter(s => s.detected).map(signal => (
                              <span key={signal.id} className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs">
                                {signal.name} (−{signal.penalty})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Initial State */}
            {!isRunning && results.length === 0 && (
              <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
                <FlaskConical size={48} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to Diagnose</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Run the diagnostic to test all 5 calibration samples and identify prediction accuracy issues.
                </p>
                <button
                  onClick={runFullDiagnostic}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                >
                  <Play size={18} className="inline mr-2" />
                  Start Diagnostic
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'calibration' && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Settings className="text-purple-500" />
                Current Calibration Configuration (FIXED)
              </h3>
              <p className="text-gray-400 mb-6">
                These parameters adjust raw component scores to reduce over-prediction bias.
                Formula: <code className="bg-gray-800 px-2 py-1 rounded">calibrated = (raw × scale) + offset</code>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'xgboost', name: 'XGBoost', scale: 0.90, offset: -5, desc: 'Quantitative ML model' },
                  { id: 'gpt4', name: 'GPT-4', scale: 0.85, offset: -3, desc: 'Qualitative LLM refinement' },
                  { id: 'pattern', name: 'Pattern', scale: 0.88, offset: -4, desc: '7 Idea Legos extraction' },
                  { id: 'historical', name: 'Historical', scale: 0.92, offset: -2, desc: 'Creator baseline comparison' },
                  { id: 'gemini', name: 'Gemini', scale: 0.82, offset: -5, desc: 'Multimodal video analysis' },
                ].map(comp => (
                  <div key={comp.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{comp.name}</span>
                      <span className="text-xs text-gray-500">{comp.desc}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500">Scale</label>
                        <div className="text-lg font-mono text-purple-400">{comp.scale}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Offset</label>
                        <div className="text-lg font-mono text-purple-400">{comp.offset}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Example: 80 → {((80 * comp.scale) + comp.offset).toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
              <h4 className="font-medium text-blue-400 mb-2">How Calibration Works</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
                <li>Each component produces a <strong>raw score</strong> (0-100)</li>
                <li>Calibration applies <code className="bg-gray-800 px-1 rounded">score × scale + offset</code> to reduce inflation</li>
                <li><span className="text-red-400">Negative signals</span> (filler words, weak hooks) apply penalties (max -25)</li>
                <li><span className="text-green-400">Positive signals</span> (strong hook, transformation story) apply bonuses (max +20)</li>
                <li>Final weighted average produces the calibrated DPS prediction</li>
                <li>Auto-calibration learns optimal parameters from actual results</li>
              </ol>
            </div>

            <div className="bg-green-500/10 border border-green-500/50 rounded-xl p-4">
              <h4 className="font-medium text-green-400 mb-2 flex items-center gap-2">
                <Sparkles size={16} />
                Positive Signal Bonuses (NEW)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { name: 'Strong Hook', bonus: '+8' },
                  { name: 'Transformation Story', bonus: '+8' },
                  { name: 'Specific Data', bonus: '+6' },
                  { name: 'Curiosity Gap', bonus: '+6' },
                  { name: 'Authority', bonus: '+5' },
                  { name: 'Clear Structure', bonus: '+5' },
                  { name: 'Emotional Resonance', bonus: '+5' },
                ].map(signal => (
                  <div key={signal.name} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
                    <span className="text-gray-300">{signal.name}</span>
                    <span className="text-green-400 font-medium">{signal.bonus}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Max bonus: +20 points</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
              <h4 className="font-medium text-red-400 mb-2">Negative Signal Penalties (REDUCED)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {[
                  { name: 'No Hook', penalty: '-15' },
                  { name: 'Weak Hook', penalty: '-12' },
                  { name: 'Too Short', penalty: '-10' },
                  { name: 'Filler Words', penalty: '-10 max' },
                  { name: 'Vague Language', penalty: '-8' },
                  { name: 'No Emotion', penalty: '-5' },
                  { name: 'Generic CTA', penalty: '-3' },
                ].map(signal => (
                  <div key={signal.name} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2">
                    <span className="text-gray-300">{signal.name}</span>
                    <span className="text-red-400 font-medium">{signal.penalty}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Max penalty: -25 points (reduced from -50)</p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-gray-800">
            <BarChart3 size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Calibration History</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Track calibration changes and accuracy improvements over time.
              Run diagnostics and store validation results to build history.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
