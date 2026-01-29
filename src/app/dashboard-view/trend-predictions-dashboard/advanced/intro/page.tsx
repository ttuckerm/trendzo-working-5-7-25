'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Brain, 
  Sparkles, 
  BarChart2, 
  LineChart, 
  UserCog, 
  CheckCircle, 
  ArrowRight,
  Bot,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MLFeaturesIntroPage() {
  const router = useRouter();
  
  // Handle back navigation
  const handleBack = () => {
    router.push('/dashboard-view/trend-predictions-dashboard');
  };
  
  return (
    <div className="container py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Machine Learning Enhanced Predictions</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover how our new machine learning capabilities can help you make better trend predictions
          </p>
        </div>
      </div>
      
      {/* Feature Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <Card className="border-blue-100">
          <CardHeader>
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle>Pattern Analysis</CardTitle>
            </div>
            <CardDescription>
              Our ML system identifies patterns in expert adjustments to improve future predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100 mb-4">
              <Image 
                src="/images/ml-pattern-analysis.png" 
                alt="Pattern Analysis Visualization"
                fill
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Pattern+Analysis';
                }}
              />
            </div>
            <p className="text-gray-700">
              The system analyzes thousands of expert adjustments to identify patterns in how 
              predictions are corrected, learning which content types follow specific growth trajectories.
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-100">
          <CardHeader>
            <div className="flex items-center mb-2">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <Lightbulb className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle>Smart Suggestions</CardTitle>
            </div>
            <CardDescription>
              Receive AI-generated suggestions to improve prediction accuracy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video relative rounded-md overflow-hidden bg-gray-100 mb-4">
              <Image 
                src="/images/ml-suggestions.png" 
                alt="ML Suggestions Interface"
                fill
                style={{ objectFit: 'cover' }}
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=Smart+Suggestions';
                }}
              />
            </div>
            <p className="text-gray-700">
              Based on historical patterns, the ML system suggests adjustments to confidence scores, 
              growth trajectories, and peak timing that you can apply with a single click.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* How It Works Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <UserCog className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Expert Feedback</h3>
            <p className="text-gray-600">
              Our experts and enterprise users provide adjustments and verifications to predictions
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. ML Pattern Analysis</h3>
            <p className="text-gray-600">
              Our machine learning system analyzes patterns in these adjustments and identifies trends
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Intelligent Suggestions</h3>
            <p className="text-gray-600">
              The system generates suggestions to improve future predictions based on these patterns
            </p>
          </div>
        </div>
      </div>
      
      {/* Feature Matrix */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Available ML Features</h2>
        
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feature
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Free
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pro
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enterprise
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <LineChart className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Basic Trend Predictions</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BarChart2 className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">ML Pattern Visualization</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Bot className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">ML Suggestions</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Limited (3/month)
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserCog className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">Expert Verification</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">ML Feedback Loop</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-gray-400">—</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="text-center">
        <Button 
          size="lg" 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => router.push('/dashboard-view/trend-predictions-dashboard')}
        >
          Explore ML Predictions
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="text-gray-500 mt-3">
          Enterprise users get full access to all machine learning features
        </p>
      </div>
    </div>
  );
} 