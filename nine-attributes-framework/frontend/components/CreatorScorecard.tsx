/**
 * Creator Scorecard Component
 * Pre-publish gate showing Nine Attributes scores
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface AttributeScore {
  name: string;
  score: number;
  evidence: Record<string, any>;
}

interface ScorecardProps {
  videoUrl?: string;
  filePath?: string;
  onPublish: () => void;
  onCancel: () => void;
}

const ATTRIBUTE_DESCRIPTIONS: Record<string, string> = {
  TAMResonance: "How broad is your potential audience?",
  Sharability: "How likely are people to share this?",
  HookStrength: "How powerful is your opening?",
  FormatInnovation: "How engaging is your presentation?",
  ValueDensity: "How much value per second?",
  PacingRhythm: "How well does it maintain momentum?",
  CuriosityGaps: "How compelling are the open loops?",
  EmotionalJourney: "How satisfying is the arc?",
  ClearPayoff: "How valuable is the conclusion?",
};

const ATTRIBUTE_TIPS: Record<string, string[]> = {
  TAMResonance: [
    "Use universal topics that appeal to many",
    "Keep videos under 60 seconds",
    "Optimize for mobile viewing",
  ],
  Sharability: [
    "Include emotional triggers",
    "Provide practical value",
    "Create 'aha' moments",
  ],
  HookStrength: [
    "Start with a question or challenge",
    "Use visual movement in first 3 seconds",
    "Add text overlay for context",
  ],
  FormatInnovation: [
    "Change angles every 2-3 seconds",
    "Use props or demonstrations",
    "Avoid static talking head",
  ],
  ValueDensity: [
    "Remove all filler words",
    "Use specific numbers and data",
    "Front-load the best insights",
  ],
  PacingRhythm: [
    "Maintain consistent energy",
    "Use pattern interrupts",
    "Build toward a climax",
  ],
  CuriosityGaps: [
    "Tease the best tip for last",
    "Use numbered structures",
    "Open loops early, close them late",
  ],
  EmotionalJourney: [
    "Create variety in emotions",
    "End on a positive note",
    "Build intensity throughout",
  ],
  ClearPayoff: [
    "Summarize key takeaways",
    "Include clear next steps",
    "Add strong call-to-action",
  ],
};

export const CreatorScorecard: React.FC<ScorecardProps> = ({
  videoUrl,
  filePath,
  onPublish,
  onCancel,
}) => {
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState<AttributeScore[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [violations, setViolations] = useState<string[]>([]);
  const [auditId, setAuditId] = useState<string>('');
  const [canPublish, setCanPublish] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    analyzeContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, filePath]);

  const analyzeContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl, file_path: filePath }),
      });
      const data = await response.json();
      setAttributes(data.attributes);
      setTotalScore(data.total_score);
      setViolations(data.violations);
      setAuditId(data.audit_id);

      const gateResponse = await fetch('/api/content/gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes: data.attributes }),
      });
      const gateData = await gateResponse.json();
      setCanPublish(gateData.pass_gate);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 8) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 5) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto border rounded p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current" />
          <span className="ml-4">Analyzing your content...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="border rounded p-6">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Content Quality Score</span>
          <span className={`text-3xl font-bold ${getScoreColor(totalScore / 9)}`} data-testid="total-score">
            {totalScore.toFixed(1)}/90
          </span>
        </div>
        <div className="mt-4 h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-500 rounded"
            style={{ width: `${(totalScore / 90) * 100}%` }}
            data-testid="score-progress"
          />
        </div>
        <div className="mt-4">
          {canPublish ? (
            <div className="text-green-700 text-sm flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" /> Your content meets all quality standards and is ready to publish!
            </div>
          ) : (
            <div className="text-red-700 text-sm">
              <div className="font-semibold mb-2">Quality gates not met:</div>
              <ul className="list-disc list-inside space-y-1">
                {violations.map((violation, idx) => (
                  <li key={idx} data-testid={`violation-${idx}`}>
                    {violation}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="border rounded p-6">
        <div className="font-semibold mb-4">Nine Attributes Breakdown</div>
        <div className="space-y-4">
          {attributes.map((attr) => (
            <div key={attr.name} className="border rounded p-4" data-testid={`attribute-${attr.name}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getScoreIcon(attr.score)}
                  <span className="font-medium">{attr.name.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <button
                    onClick={() => setShowDetails(showDetails === attr.name ? null : attr.name)}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                    data-testid={`details-btn-${attr.name}`}
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
                <span className={`font-bold text-lg ${getScoreColor(attr.score)}`} data-testid={`score-${attr.name}`}>
                  {attr.score.toFixed(1)}/10
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{ATTRIBUTE_DESCRIPTIONS[attr.name]}</div>
              <div className="h-1 bg-gray-200 rounded">
                <div className="h-1 bg-blue-500 rounded" style={{ width: `${attr.score * 10}%` }} />
              </div>
              {showDetails === attr.name && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <div className="space-y-3">
                    <div>
                      <div className="font-semibold text-sm mb-1">Evidence:</div>
                      <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">{JSON.stringify(attr.evidence, null, 2)}</pre>
                    </div>
                    {attr.score < 8 && (
                      <div>
                        <div className="font-semibold text-sm mb-1">Tips to Improve:</div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {ATTRIBUTE_TIPS[attr.name]?.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded p-6">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Audit ID: <code className="bg-gray-100 px-2 py-1 rounded">{auditId}</code>
          </div>
          <div className="space-x-4">
            <button className="px-3 py-2 border rounded" onClick={onCancel} data-testid="cancel-btn">
              Cancel
            </button>
            <button className="px-3 py-2 border rounded bg-blue-600 text-white disabled:opacity-60" onClick={onPublish} disabled={!canPublish} data-testid="publish-btn">
              {canPublish ? 'Publish Content' : 'Fix Issues First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


