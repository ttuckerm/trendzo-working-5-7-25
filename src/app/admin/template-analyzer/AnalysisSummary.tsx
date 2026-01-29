import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VideoAnalysis {
  templateCategory: string;
  templateStructure: {
    sections: Array<{
      type: string;
      timing: string;
      description: string;
    }>;
  };
  viralPotential: number;
  similarTemplates: Array<{
    id: string;
    similarityScore: number;
    category: string;
  }>;
  keyMetrics: {
    engagementRate: number;
    completionRate: number;
    shareability: number;
  };
  analysisConfidence: number;
  templateNotes: string;
}

interface AnalysisSummaryProps {
  analysis: VideoAnalysis;
}

export default function AnalysisSummary({ analysis }: AnalysisSummaryProps) {
  if (!analysis) return null;

  // Calculate overall score based on metrics and viral potential
  const calculateOverallScore = () => {
    const { engagementRate, completionRate, shareability } = analysis.keyMetrics;
    const { viralPotential } = analysis;
    
    // Weighted average of metrics
    const overallScore = (
      engagementRate * 0.3 + 
      viralPotential * 0.3 + 
      (completionRate * 10) * 0.2 + 
      shareability * 0.2
    ).toFixed(1);
    
    return overallScore;
  };

  // Determine template complexity based on number of sections
  const getTemplateComplexity = () => {
    const sectionCount = analysis.templateStructure.sections.length;
    
    if (sectionCount <= 2) return 'Simple';
    if (sectionCount <= 4) return 'Moderate';
    return 'Complex';
  };

  // Get color class based on score value
  const getScoreColorClass = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key findings */}
          <div>
            <h3 className="text-lg font-medium mb-3">Key Findings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Template Type</div>
                <div className="font-semibold">{analysis.templateCategory}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Complexity</div>
                <div className="font-semibold">{getTemplateComplexity()}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Overall Score</div>
                <div className={`font-semibold ${getScoreColorClass(parseFloat(calculateOverallScore()))}`}>
                  {calculateOverallScore()}/10
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-500">Confidence</div>
                <div className="font-semibold">
                  {(analysis.analysisConfidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          {/* Template structure summary */}
          <div>
            <h3 className="text-lg font-medium mb-3">Structure Summary</h3>
            <div className="relative">
              {/* Horizontal bar to represent video timeline */}
              <div className="h-8 bg-gray-100 rounded-full relative mb-6">
                {analysis.templateStructure.sections.map((section, index) => {
                  // Extract start and end seconds from timing string (e.g., "0-5s")
                  const [start, end] = section.timing.replace('s', '').split('-').map(Number);
                  const totalDuration = analysis.templateStructure.sections.reduce(
                    (total, s) => {
                      const [, sectionEnd] = s.timing.replace('s', '').split('-').map(Number);
                      return Math.max(total, sectionEnd);
                    }, 0
                  );
                  
                  // Calculate position and width percentages
                  const startPercent = (start / totalDuration) * 100;
                  const widthPercent = ((end - start) / totalDuration) * 100;
                  
                  // Assign color based on section type
                  let bgColor = 'bg-gray-400';
                  if (section.type.toLowerCase().includes('intro')) bgColor = 'bg-blue-500';
                  if (section.type.toLowerCase().includes('content')) bgColor = 'bg-green-500';
                  if (section.type.toLowerCase().includes('outro')) bgColor = 'bg-purple-500';
                  if (section.type.toLowerCase().includes('cta')) bgColor = 'bg-red-500';
                  if (section.type.toLowerCase().includes('hook')) bgColor = 'bg-yellow-500';
                  
                  return (
                    <div
                      key={index}
                      className={`absolute top-0 h-full ${bgColor} rounded-full`}
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`
                      }}
                    />
                  );
                })}
              </div>
              
              {/* Section labels */}
              <div className="space-y-2">
                {analysis.templateStructure.sections.map((section, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-20 text-xs">{section.timing}</div>
                    <div className="flex-1 font-medium text-sm">{section.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-lg font-medium mb-3">Usage Recommendations</h3>
            <div className="bg-blue-50 p-4 rounded-md text-sm">
              <p className="mb-2 font-medium text-blue-800">Based on the analysis, this template is best for:</p>
              <ul className="list-disc pl-5 text-blue-800 space-y-1">
                {analysis.viralPotential >= 8 && (
                  <li>Viral content with strong growth potential</li>
                )}
                {analysis.viralPotential >= 6 && analysis.viralPotential < 8 && (
                  <li>Steady growth content with moderate reach</li>
                )}
                {analysis.viralPotential < 6 && (
                  <li>Niche audience content with specific targeting</li>
                )}
                {analysis.keyMetrics.engagementRate >= 8 && (
                  <li>High engagement content that encourages interaction</li>
                )}
                {analysis.keyMetrics.shareability >= 8 && (
                  <li>Shareable content that can spread organically</li>
                )}
                <li>Content in the {analysis.templateCategory.toLowerCase()} category</li>
                {analysis.templateStructure.sections.some(s => 
                  s.type.toLowerCase().includes('cta')
                ) && (
                  <li>Content with strong calls to action for conversion</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 