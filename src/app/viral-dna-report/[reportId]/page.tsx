'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeftIcon, DownloadIcon, ShareIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ViralDNAReport } from '@/lib/services/viralDNAReportService';

export default function ViralDNAReportViewPage() {
  const params = useParams();
  const reportId = params.reportId as string;
  const [report, setReport] = useState<ViralDNAReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const response = await fetch(`/api/viral-dna-report?id=${reportId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch report');
      }

      setReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
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

  const shareReport = async () => {
    if (!report) return;
    
    const shareData = {
      title: `Viral DNA Report for @${report.userHandle}`,
      text: `Check out my viral DNA analysis - Score: ${report.viralScore}/100`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Report link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
          >
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Report...</h2>
          <p className="text-purple-200">Retrieving your viral DNA analysis</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 text-red-400">⚠️</div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Report Not Found</h2>
          <p className="text-purple-200 mb-6">{error}</p>
          <Link href="/viral-dna-report">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Generate New Report
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/viral-dna-report">
            <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button
              onClick={shareReport}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <ShareIcon className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button
              onClick={downloadReport}
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Viral DNA Report
            </h1>
            <h2 className="text-2xl text-purple-200 mb-4">
              @{report.userHandle}
            </h2>
            <p className="text-purple-300">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Current Viral Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(report.viralScore)} mb-2`}>
                  {report.viralScore}
                </div>
                <p className="text-purple-200">out of 100</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Viral Potential</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(report.viralProbability.potential)} mb-2`}>
                  {report.viralProbability.potential}
                </div>
                <p className="text-purple-200">with optimization</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-center">Top Video Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(report.topPerformingContent[0]?.viralScore || 0)} mb-2`}>
                  {report.topPerformingContent[0]?.viralScore || 0}
                </div>
                <p className="text-purple-200">best performance</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Content */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">🏆 Top Performing Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.topPerformingContent.map((content, index) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">#{index + 1} {content.title}</h4>
                      <Badge className={`${getScoreBg(content.viralScore)} text-white`}>
                        {content.viralScore} Score
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-purple-200">
                      <div>Views: {content.viewCount.toLocaleString()}</div>
                      <div>Likes: {content.likeCount.toLocaleString()}</div>
                      <div>Patterns: {content.patterns.length}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardHeader>
                <CardTitle className="text-white">🧬 Most Used Frameworks</CardTitle>
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
                <CardTitle className="text-white">⚡ Improvement Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.viralProbability.improvementAreas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="bg-yellow-500/20 text-yellow-200 mr-2 mb-2">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Predictions */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">🔮 Trend Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {report.trendPredictions.map((trend, index) => (
                  <div key={index} className="border border-white/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">{trend.title}</h4>
                      <Badge className="bg-yellow-500/20 text-yellow-300">
                        {trend.expectedViralScore} Score
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-purple-200">
                      <div>Framework: {trend.framework}</div>
                      <div>Window: {trend.inceptionWindow}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Posting Optimization */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">📅 Posting Optimization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white font-semibold mb-3">Best Times to Post</h4>
                  <div className="space-y-2">
                    {report.postingOptimization.bestTimes.map((time, index) => (
                      <div key={index} className="text-purple-200 text-sm">
                        🕐 {time}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-3">Optimal Frequency</h4>
                  <p className="text-purple-200 text-sm">
                    {report.postingOptimization.optimalFrequency}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
            <CardHeader>
              <CardTitle className="text-white">🎯 Recommended Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-4 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-purple-200">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Unlock Your Viral Potential?
            </h3>
            <p className="text-purple-200 mb-6">
              Join Trendzo to get daily trend predictions, viral templates, and optimization tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6">
                Start Your $97 Trial
              </Button>
              <Link href="/viral-dna-report">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Generate Another Report
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}