'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Wand2, Upload, Link, Play, AlertCircle, CheckCircle2, TrendingUp, Target, Lightbulb, FileText } from 'lucide-react';

interface AnalysisResult {
  viralScore: number;
  predictedViews: number;
  matchedTemplate: {
    name: string;
    similarity: number;
    status: string;
  };
  issues: {
    type: 'critical' | 'warning' | 'suggestion';
    category: string;
    description: string;
    fix: string;
  }[];
  improvements: {
    category: string;
    current: string;
    suggested: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  genes: {
    name: string;
    strength: number;
    present: boolean;
  }[];
}

export default function DraftsAnalyzerPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'upload'>('url');

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) return;

    setAnalyzing(true);
    
    // Simulate analysis - would call real API
    setTimeout(() => {
      const mockResult: AnalysisResult = {
        viralScore: 0.73,
        predictedViews: 125000,
        matchedTemplate: {
          name: 'Authority Transformation',
          similarity: 0.84,
          status: 'HOT'
        },
        issues: [
          {
            type: 'critical',
            category: 'Hook',
            description: 'Hook is too weak - takes 8 seconds to get to the point',
            fix: 'Start with the transformation result immediately: "This 30-day transformation will shock you"'
          },
          {
            type: 'warning',
            category: 'Visual',
            description: 'Before/after comparison not clear enough',
            fix: 'Use split-screen or side-by-side layout for maximum impact'
          },
          {
            type: 'suggestion',
            category: 'Audio',
            description: 'Background music volume could be optimized',
            fix: 'Reduce music by 15% to improve voice clarity'
          }
        ],
        improvements: [
          {
            category: 'Opening Hook',
            current: '"Hey guys, today I want to show you something amazing..."',
            suggested: '"This 30-day transformation will change how you see fitness forever"',
            impact: 'high'
          },
          {
            category: 'Call to Action',
            current: 'Weak CTA at the end',
            suggested: 'Add mid-video engagement: "Comment TRANSFORM if you want the full workout plan"',
            impact: 'medium'
          },
          {
            category: 'Visual Pacing',
            current: 'Static shots for 6+ seconds',
            suggested: 'Cut every 2-3 seconds, add zoom effects on key moments',
            impact: 'high'
          }
        ],
        genes: [
          { name: 'AuthorityHook', strength: 0.42, present: false },
          { name: 'TransformationBeforeAfter', strength: 0.78, present: true },
          { name: 'EmotionalAgitation', strength: 0.23, present: false },
          { name: 'SocialProof', strength: 0.15, present: false },
          { name: 'UrgencyTrigger', strength: 0.67, present: true },
          { name: 'ProblemSolution', strength: 0.89, present: true }
        ]
      };

      setAnalysisResult(mockResult);
      setAnalyzing(false);
    }, 3000);
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-700';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'suggestion': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-orange-100 text-orange-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wand2 className="h-8 w-8 text-purple-600" />
                🎯 My Drafts Analyzer
              </h1>
              <p className="text-gray-600 mt-1">Paste any video URL to get AI-powered viral optimization suggestions</p>
            </div>
            <Badge variant="secondary" className="px-3 py-1">
              <Target className="h-4 w-4 mr-1" />
              Single Video Testing
            </Badge>
          </div>

          {/* Input Section */}
          <div className="space-y-4">
            {/* Upload Method Toggle */}
            <div className="flex gap-2">
              <Button
                variant={uploadMethod === 'url' ? 'default' : 'outline'}
                onClick={() => setUploadMethod('url')}
                size="sm"
              >
                <Link className="h-4 w-4 mr-1" />
                Video URL
              </Button>
              <Button
                variant={uploadMethod === 'upload' ? 'default' : 'outline'}
                onClick={() => setUploadMethod('upload')}
                size="sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload File
              </Button>
            </div>

            {/* Input Area */}
            {uploadMethod === 'url' ? (
              <div className="flex gap-3">
                <Input
                  placeholder="Paste TikTok, Instagram, or YouTube URL here..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || !videoUrl.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Analyze Video
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Drag and drop your video file here, or click to browse</p>
                <p className="text-sm text-gray-500">Supports MP4, MOV, AVI (max 100MB)</p>
                <Button variant="outline" className="mt-4">Choose File</Button>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <>
            {/* Viral Score Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Viral Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {Math.round(analysisResult.viralScore * 100)}%
                  </div>
                  <p className="text-purple-100 text-sm">
                    Predicted viral potential based on 48 viral genes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Predicted Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analysisResult.predictedViews.toLocaleString()}
                  </div>
                  <p className="text-gray-600 text-sm">
                    Estimated reach in first 7 days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Template Match</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{analysisResult.matchedTemplate.name}</span>
                    <Badge className="bg-red-100 text-red-700">
                      {analysisResult.matchedTemplate.status}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {Math.round(analysisResult.matchedTemplate.similarity * 100)}% similarity
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Issues & Fixes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Issues & Quick Fixes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.issues.map((issue, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getIssueColor(issue.type)}`}>
                      <div className="flex items-start gap-3">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{issue.category}</span>
                            <Badge variant="outline" className="text-xs">
                              {issue.type}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{issue.description}</p>
                          <div className="bg-white/50 p-2 rounded text-sm">
                            <span className="font-medium">💡 Fix: </span>
                            {issue.fix}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Improvements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Suggested Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisResult.improvements.map((improvement, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{improvement.category}</h4>
                        <Badge className={getImpactColor(improvement.impact)}>
                          {improvement.impact} impact
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block mb-1">Current:</span>
                          <div className="bg-red-50 p-2 rounded border-l-4 border-red-500">
                            {improvement.current}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 block mb-1">Suggested:</span>
                          <div className="bg-green-50 p-2 rounded border-l-4 border-green-500">
                            {improvement.suggested}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Viral Genes Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  Viral Genes Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisResult.genes.map((gene, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{gene.name}</span>
                        {gene.present ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${gene.present ? 'bg-green-500' : 'bg-gray-400'}`}
                          style={{ width: `${gene.strength * 100}%` }}
                        />
                      </div>
                      
                      <span className="text-xs text-gray-500">
                        {Math.round(gene.strength * 100)}% strength
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <FileText className="h-4 w-4 mr-2" />
                Export Full Report
              </Button>
              <Button variant="outline">
                <TrendingUp className="h-4 w-4 mr-2" />
                Apply Suggestions
              </Button>
              <Button variant="outline">
                Analyze Another Video
              </Button>
            </div>
          </>
        )}

        {/* Instructions */}
        {!analysisResult && !analyzing && (
          <Card>
            <CardHeader>
              <CardTitle>How to Use the Drafts Analyzer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h3 className="font-medium mb-2">Paste Video URL</h3>
                  <p className="text-sm text-gray-600">Add your TikTok, Instagram, or YouTube video link</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <h3 className="font-medium mb-2">AI Analysis</h3>
                  <p className="text-sm text-gray-600">Our system analyzes 48 viral genes and patterns</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <h3 className="font-medium mb-2">Get Fixes</h3>
                  <p className="text-sm text-gray-600">Receive specific, actionable improvement suggestions</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-orange-600 font-bold">4</span>
                  </div>
                  <h3 className="font-medium mb-2">Apply & Succeed</h3>
                  <p className="text-sm text-gray-600">Implement changes and boost your viral potential</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}