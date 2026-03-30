'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Video, 
  Zap, 
  Target, 
  Star, 
  TrendingUp, 
  Upload,
  Play,
  Eye,
  Heart,
  Share,
  MessageCircle,
  Clock,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ViralAnalysis {
  video_probability: number;
  closest_template: {
    id: string;
    name: string;
    status: string;
    distance: number;
  };
  top_gene_matches: string[];
  optimization_suggestions: string[];
  confidence_score: number;
  analysis_id: string;
}

interface Template {
  id: string;
  name: string;
  viral_score: number;
  success_rate: number;
  status: string;
  preview_url?: string;
}

interface UserStats {
  analyses_used_today: number;
  daily_limit: number;
  total_analyses: number;
  avg_viral_score: number;
  best_score: number;
}

export default function ViralAnalyzerPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ViralAnalysis | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    analyses_used_today: 0,
    daily_limit: 3,
    total_analyses: 0,
    avg_viral_score: 0,
    best_score: 0
  });
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    fetchTopTemplates();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/stats');
      const data = await response.json();
      if (data.success) {
        setUserStats(data.stats);
        setRecentAnalyses(data.recent_analyses || []);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchTopTemplates = async () => {
    try {
      const response = await fetch('/api/user/templates/top');
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const analyzeVideo = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    if (userStats.analyses_used_today >= userStats.daily_limit) {
      setError('Daily analysis limit reached. Upgrade for unlimited access!');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/user/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_url: videoUrl })
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        fetchUserData(); // Refresh user stats
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (error) {
      setError('Failed to analyze video. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getViralityColor = (score: number) => {
    if (score >= 0.8) return 'text-red-500';
    if (score >= 0.6) return 'text-orange-500';
    if (score >= 0.4) return 'text-yellow-500';
    return 'text-gray-500';
  };

  const getViralityLabel = (score: number) => {
    if (score >= 0.8) return '🔥 VIRAL';
    if (score >= 0.6) return '📈 STRONG';
    if (score >= 0.4) return '⚡ MODERATE';
    return '📉 LOW';
  };

  const getTemplateStatusIcon = (status: string) => {
    switch (status) {
      case 'HOT': return '🔥';
      case 'NEW': return '✨';
      case 'COOLING': return '❄️';
      case 'STABLE': return '🎯';
      default: return '📊';
    }
  };

  const canAnalyze = userStats.analyses_used_today < userStats.daily_limit;
  const remainingAnalyses = userStats.daily_limit - userStats.analyses_used_today;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎯 Viral Video Analyzer
        </h1>
        <p className="text-muted-foreground text-lg">
          Get instant viral probability scores with AI-powered analysis
        </p>
      </div>

      {/* User Stats Dashboard */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Today</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userStats.analyses_used_today}/{userStats.daily_limit}
            </div>
            <Progress 
              value={(userStats.analyses_used_today / userStats.daily_limit) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {remainingAnalyses} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total_analyses}</div>
            <p className="text-xs text-muted-foreground">
              Videos analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getViralityColor(userStats.avg_viral_score)}`}>
              {(userStats.avg_viral_score * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Viral probability
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getViralityColor(userStats.best_score)}`}>
              {(userStats.best_score * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Video Analyzer */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-purple-400 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-purple-600" />
            Analyze Your Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Paste your TikTok/Instagram/YouTube video URL here..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="text-lg"
              />
            </div>
            <Button 
              onClick={analyzeVideo}
              disabled={!canAnalyze || isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 px-8"
              size="lg"
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              Analyze
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!canAnalyze && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                You've reached your daily limit of {userStats.daily_limit} analyses. 
                <Button variant="link" className="p-0 ml-1 h-auto">
                  Upgrade for unlimited access
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🎯 Analysis Results</span>
              <Badge className="bg-purple-100 text-purple-800">
                Confidence: {(analysis.confidence_score * 100).toFixed(0)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Viral Score */}
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div className={`text-6xl font-bold ${getViralityColor(analysis.video_probability)}`}>
                  {(analysis.video_probability * 100).toFixed(0)}%
                </div>
                <div className="text-xl font-semibold">
                  {getViralityLabel(analysis.video_probability)}
                </div>
                <Progress 
                  value={analysis.video_probability * 100} 
                  className="w-full max-w-md mx-auto h-3"
                />
              </div>
            </div>

            {/* Template Match */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">🧬 Closest Template Match</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{analysis.closest_template.name}</span>
                      <Badge variant="outline">{analysis.closest_template.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Similarity: {((1 - analysis.closest_template.distance) * 100).toFixed(0)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">🔥 Top Viral Elements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {analysis.top_gene_matches.slice(0, 4).map((gene, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {gene}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Optimization Suggestions */}
            {analysis.optimization_suggestions && analysis.optimization_suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">💡 Optimization Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.optimization_suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hot Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            🔥 Top Viral Templates
            <Badge className="ml-2 bg-red-100 text-red-800">HOT</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.slice(0, 6).map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{template.name}</span>
                      <span className="text-lg">{getTemplateStatusIcon(template.status)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Viral Score:</span>
                        <span className={`font-bold ${getViralityColor(template.viral_score)}`}>
                          {(template.viral_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Progress value={template.viral_score * 100} className="h-2" />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Success Rate: {(template.success_rate * 100).toFixed(0)}%</span>
                      <Badge variant="outline" className="text-xs">
                        {template.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-4 text-center">
            <Button variant="outline">
              View All Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map((recent, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium">
                        Video Analysis #{recent.id?.slice(0, 8)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(recent.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getViralityColor(recent.viral_score)}`}>
                      {(recent.viral_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getViralityLabel(recent.viral_score)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-bold mb-2">🚀 Unlock Unlimited Analysis</h3>
          <p className="mb-4 opacity-90">
            Get unlimited video analyses, advanced optimization tips, and access to all viral templates
          </p>
          <Button className="bg-white text-purple-600 hover:bg-gray-100">
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}