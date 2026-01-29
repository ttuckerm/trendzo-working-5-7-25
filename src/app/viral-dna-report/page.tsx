'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TikTokIcon, SparklesIcon, TrendingUpIcon, ClockIcon, MailIcon, DownloadIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ViralDNAReport } from '@/lib/services/viralDNAReportService';

const TIKTOK_ICON = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function ViralDNAReportPage() {
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ViralDNAReport | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'generating' | 'report'>('input');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handle.trim()) {
      setError('Please enter your TikTok handle');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStep('generating');

    try {
      const response = await fetch('/api/viral-dna-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReport(data.report);
      setStep('report');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportData = JSON.stringify(report, null, 2);
    const blob = new Blob([reportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viral-dna-report-${report.userHandle}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto mt-20"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                >
                  <TIKTOK_ICON />
                </motion.div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Your Viral DNA Report
                </h1>
                <p className="text-purple-200">
                  Discover your unique viral potential with AI-powered analysis
                </p>
              </div>

              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-center">
                    Get Your Free Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="handle" className="text-white">
                        TikTok Handle
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          @
                        </span>
                        <Input
                          id="handle"
                          type="text"
                          placeholder="yourusername"
                          value={handle}
                          onChange={(e) => setHandle(e.target.value)}
                          className="pl-8 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-white">
                        Email (Optional)
                      </Label>
                      <div className="relative">
                        <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                        />
                      </div>
                      <p className="text-xs text-purple-200 mt-1">
                        Get your report delivered via email
                      </p>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-500/20 border border-red-500/30 rounded-lg p-3"
                      >
                        <p className="text-red-200 text-sm">{error}</p>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                    >
                      {isGenerating ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Analyzing...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <SparklesIcon className="w-4 h-4 mr-2" />
                          Generate My Viral DNA
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="mt-8 text-center">
                <p className="text-purple-200 text-sm">
                  ✨ Free forever • No signup required • Instant results
                </p>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto mt-20 text-center"
            >
              <div className="mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
                >
                  <SparklesIcon className="w-8 h-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Analyzing Your Viral DNA
                </h2>
                <p className="text-purple-200">
                  Scanning your content for viral patterns...
                </p>
              </div>

              <div className="space-y-4">
                {[
                  'Scraping your latest videos...',
                  'Analyzing viral patterns...',
                  'Calculating potential scores...',
                  'Generating recommendations...'
                ].map((text, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.5 }}
                    className="flex items-center justify-center text-white"
                  >
                    <div className="animate-pulse w-2 h-2 bg-purple-400 rounded-full mr-3" />
                    {text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'report' && report && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Viral DNA Report for @{report.userHandle}
                </h1>
                <p className="text-purple-200">
                  Generated on {new Date(report.generatedAt).toLocaleDateString()}
                </p>
                
                <div className="flex justify-center mt-4">
                  <Button
                    onClick={downloadReport}
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
                  <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="content" className="text-white data-[state=active]:bg-white/20">
                    Top Content
                  </TabsTrigger>
                  <TabsTrigger value="patterns" className="text-white data-[state=active]:bg-white/20">
                    Patterns
                  </TabsTrigger>
                  <TabsTrigger value="trends" className="text-white data-[state=active]:bg-white/20">
                    Trends
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Viral Score */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <TrendingUpIcon className="w-5 h-5 mr-2" />
                          Viral Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className={`text-4xl font-bold ${getScoreColor(report.viralScore)}`}>
                            {report.viralScore}
                          </div>
                          <p className="text-purple-200 text-sm">Current Performance</p>
                          
                          <div className="mt-4">
                            <div className="flex justify-between text-sm text-purple-200 mb-1">
                              <span>Potential</span>
                              <span>{report.viralProbability.potential}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getScoreBg(report.viralProbability.potential)}`}
                                style={{ width: `${report.viralProbability.potential}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Improvement Areas */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Improvement Areas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.viralProbability.improvementAreas.map((area, index) => (
                            <Badge key={index} variant="secondary" className="bg-purple-500/20 text-purple-200">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Posting Optimization */}
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center">
                          <ClockIcon className="w-5 h-5 mr-2" />
                          Best Times
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.postingOptimization.bestTimes.map((time, index) => (
                            <div key={index} className="text-purple-200 text-sm">
                              {time}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Next Steps */}
                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Recommended Next Steps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.nextSteps.map((step, index) => (
                          <div key={index} className="flex items-start">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 mt-0.5">
                              {index + 1}
                            </div>
                            <p className="text-purple-200">{step}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="content" className="space-y-6">
                  <div className="grid gap-6">
                    {report.topPerformingContent.map((content, index) => (
                      <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <span>#{index + 1} Top Performing Video</span>
                            <Badge className={`${getScoreBg(content.viralScore)} text-white`}>
                              {content.viralScore} Score
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <h3 className="text-purple-200 font-semibold mb-2">{content.title}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-purple-300">Views:</span>
                              <span className="text-white ml-2">{content.viewCount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-purple-300">Likes:</span>
                              <span className="text-white ml-2">{content.likeCount.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-purple-300">Patterns:</span>
                              <span className="text-white ml-2">{content.patterns.length}</span>
                            </div>
                          </div>
                          {content.patterns.length > 0 && (
                            <div className="mt-4">
                              <p className="text-purple-300 text-sm mb-2">Detected Patterns:</p>
                              <div className="flex flex-wrap gap-2">
                                {content.patterns.map((pattern, pIndex) => (
                                  <Badge key={pIndex} variant="outline" className="border-purple-500 text-purple-200">
                                    {pattern.patternName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="patterns" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Most Used Frameworks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {report.contentPatterns.mostUsedFrameworks.map((framework, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-purple-200">{framework}</span>
                              <Badge variant="secondary" className="bg-purple-500/20 text-purple-200">
                                #{index + 1}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white/10 backdrop-blur-md border-white/20">
                      <CardHeader>
                        <CardTitle className="text-white">Missed Opportunities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {report.contentPatterns.missedOpportunities.map((opportunity, index) => (
                            <div key={index} className="text-purple-200 text-sm">
                              • {opportunity}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="bg-white/10 backdrop-blur-md border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white">Successful Patterns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {report.contentPatterns.successfulPatterns.map((pattern, index) => (
                          <div key={index} className="border border-white/20 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-white font-semibold">{pattern.patternName}</h4>
                              <Badge className="bg-green-500/20 text-green-300">
                                {Math.round(pattern.confidenceScore * 100)}% Match
                              </Badge>
                            </div>
                            <p className="text-purple-200 text-sm">{pattern.frameworkName} Framework</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                  <div className="grid gap-6">
                    {report.trendPredictions.map((trend, index) => (
                      <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center justify-between">
                            <span>{trend.title}</span>
                            <Badge className="bg-yellow-500/20 text-yellow-300">
                              {trend.expectedViralScore} Score
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-purple-300">Framework:</span>
                              <span className="text-white ml-2">{trend.framework}</span>
                            </div>
                            <div>
                              <span className="text-purple-300">Inception Window:</span>
                              <span className="text-white ml-2">{trend.inceptionWindow}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8 text-center">
                <Button
                  onClick={() => {
                    setStep('input');
                    setReport(null);
                    setHandle('');
                    setEmail('');
                  }}
                  variant="outline"
                  className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  Generate Another Report
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}