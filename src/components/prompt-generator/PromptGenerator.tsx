/**
 * AI Video Prompt Generator Component
 * Enhanced with genre override, manual editing, and smart detection
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Copy, Check, Sparkles, Edit2 } from 'lucide-react';

const GENRES = [
  'Auto-detect',
  'Horror',
  'Action',
  'Sci-Fi',
  'Romance',
  'Documentary',
  'Comedy',
  'Drama',
  'Thriller',
];

interface PromptGeneratorProps {
  onPromptGenerated?: (prompt: string, data: any) => void;
  initialInput?: string;
  dpsContext?: {
    target_score: number;
    viral_patterns: string[];
    niche: string;
  };
}

export function PromptGenerator({
  onPromptGenerated,
  initialInput = '',
  dpsContext,
}: PromptGeneratorProps) {
  const [userInput, setUserInput] = useState(initialInput);
  const [selectedGenre, setSelectedGenre] = useState('Auto-detect');
  const [useSmartDetection, setUseSmartDetection] = useState(true);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const handleGenerate = async () => {
    if (!userInput.trim()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/prompt-generation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: userInput,
          constraints: {
            genre_override: selectedGenre !== 'Auto-detect' ? selectedGenre.toLowerCase() : undefined,
          },
          dps_context: dpsContext || {
            target_score: 75,
            viral_patterns: [],
            niche: 'general',
          },
          use_smart_detection: useSmartDetection && selectedGenre === 'Auto-detect',
        }),
      });

      const result = await response.json();

      if (result.success) {
        const prompt = result.data.cinematic_prompt;
        setGeneratedPrompt(prompt);
        setEditablePrompt(prompt);
        setResultData(result.data);
        setIsEditing(false);

        if (onPromptGenerated) {
          onPromptGenerated(prompt, result.data);
        }
      } else {
        alert(result.error || 'Failed to generate prompt');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Failed to generate prompt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editablePrompt : generatedPrompt;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUseEdited = () => {
    setGeneratedPrompt(editablePrompt);
    setIsEditing(false);
    if (onPromptGenerated) {
      onPromptGenerated(editablePrompt, resultData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-500" />
            AI Video Prompt Generator
          </CardTitle>
          <CardDescription>
            Transform your video concept into a production-ready cinematic prompt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe your video concept:
            </label>
            <Textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., 'Halloween haunted house' or 'Epic space battle' or 'AI side hustle tutorial'"
              rows={4}
              className="w-full"
            />
          </div>

          {/* Genre Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Genre:</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GENRES.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Smart Detection Toggle */}
            {selectedGenre === 'Auto-detect' && (
              <div>
                <label className="block text-sm font-medium mb-2">Detection Mode:</label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    checked={useSmartDetection}
                    onChange={(e) => setUseSmartDetection(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">
                    Use AI Smart Detection {useSmartDetection && '(GPT-4o-mini)'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!userInput.trim() || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Cinematic Prompt...
              </span>
            ) : (
              'Generate Cinematic Prompt'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Prompt Section */}
      {generatedPrompt && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Generated Cinematic Prompt</CardTitle>
                {resultData && (
                  <CardDescription className="mt-1">
                    Genre: {resultData.reasoning.detected_genre} • Mood:{' '}
                    {resultData.reasoning.detected_mood}
                    {resultData.dps_alignment && (
                      <> • Expected DPS: {resultData.dps_alignment.expected_impact}</>
                    )}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  {isEditing ? 'Cancel Edit' : 'Edit'}
                </Button>
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Display / Edit */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editablePrompt}
                  onChange={(e) => setEditablePrompt(e.target.value)}
                  rows={12}
                  className="w-full font-mono text-sm"
                />
                <Button onClick={handleUseEdited} className="w-full">
                  Use Edited Prompt
                </Button>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {generatedPrompt}
                </p>
              </div>
            )}

            {/* Ready Indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="w-4 h-4" />
                <span className="font-medium">Ready for Sora, Runway, or Kling</span>
              </div>
              {resultData?.dps_alignment?.predicted_elements &&
                resultData.dps_alignment.predicted_elements.length > 0 && (
                  <div className="text-xs text-gray-600">
                    Viral Elements: {resultData.dps_alignment.predicted_elements.join(', ')}
                  </div>
                )}
            </div>

            {/* Smart Analysis (if available) */}
            {resultData?.reasoning?.smart_analysis && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-xs font-semibold text-blue-900 mb-1">
                  AI Analysis:
                </div>
                <div className="text-xs text-blue-800">
                  {resultData.reasoning.smart_analysis}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
