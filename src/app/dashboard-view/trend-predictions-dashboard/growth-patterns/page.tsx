'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LineChart, TrendingUp, ArrowUpRight, TrendingDown, BarChart2, Filter, Download, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { resolveComponents, initializeComponentResolution } from '@/lib/utils/import-resolver';
import { useComponentFix } from '@/lib/utils/component-fix';

// Initialize component resolution
if (typeof window !== 'undefined') {
  initializeComponentResolution();
}

// Resolve UI components to ensure they work correctly
const UIComponents = resolveComponents({
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
});

export default function GrowthPatternsPage() {
  const router = useRouter();
  
  // State for filters
  const [timeRange, setTimeRange] = useState('90d');
  const [contentType, setContentType] = useState('all');
  
  // Use the component fix hook for safety
  useEffect(() => {
    const cleanup = useComponentFix();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, []);
  
  // Destructure UI components for usage
  const { 
    Badge, 
    Button, 
    Card, 
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
  } = UIComponents;
  
  // Function to render a sample trend chart
  const renderTrendChart = (type: string) => {
    // In a real implementation, this would render an actual chart
    // For now, we'll use a placeholder pattern indicator
    
    let pattern;
    switch (type) {
      case 'exponential':
        pattern = (
          <div className="h-24 w-full flex items-end justify-between space-x-1">
            {[5, 8, 12, 19, 32, 55, 82].map((height, i) => (
              <div 
                key={i} 
                className="bg-green-500 rounded-t w-full" 
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        );
        break;
      case 'linear':
        pattern = (
          <div className="h-24 w-full flex items-end justify-between space-x-1">
            {[10, 20, 30, 40, 50, 60, 70].map((height, i) => (
              <div 
                key={i} 
                className="bg-blue-500 rounded-t w-full" 
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        );
        break;
      case 'plateauing':
        pattern = (
          <div className="h-24 w-full flex items-end justify-between space-x-1">
            {[10, 25, 40, 60, 70, 75, 77].map((height, i) => (
              <div 
                key={i} 
                className="bg-amber-500 rounded-t w-full" 
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        );
        break;
      default: // volatile
        pattern = (
          <div className="h-24 w-full flex items-end justify-between space-x-1">
            {[20, 50, 35, 60, 40, 70, 55].map((height, i) => (
              <div 
                key={i} 
                className="bg-red-500 rounded-t w-full" 
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        );
    }
    
    return pattern;
  };
  
  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.push('/dashboard-view/trend-predictions-dashboard')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Growth Pattern Analysis</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="180d">Last 180 Days</SelectItem>
              <SelectItem value="1y">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="dance">Dance</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="border-gray-300">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
      
      <p className="text-gray-500 mb-8">
        Analyze growth patterns across different content categories to identify trends and improve prediction accuracy.
      </p>
      
      {/* Growth Pattern Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <ArrowUpRight className="h-5 w-5 mr-2 text-green-600" />
                Exponential
              </CardTitle>
              <Badge className="bg-green-100 text-green-800">25% of trends</Badge>
            </div>
            <CardDescription>Rapid, accelerating growth</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTrendChart('exponential')}
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Avg. Time to Peak:</span>
                <span className="font-medium">12 days</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Prediction Accuracy:</span>
                <span className="font-medium">88%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                Linear
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-800">42% of trends</Badge>
            </div>
            <CardDescription>Steady, consistent growth</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTrendChart('linear')}
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Avg. Time to Peak:</span>
                <span className="font-medium">21 days</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Prediction Accuracy:</span>
                <span className="font-medium">76%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-amber-600" />
                Plateauing
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-800">28% of trends</Badge>
            </div>
            <CardDescription>Initial growth then leveling</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTrendChart('plateauing')}
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Avg. Time to Peak:</span>
                <span className="font-medium">18 days</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Prediction Accuracy:</span>
                <span className="font-medium">84%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center">
                <BarChart2 className="h-5 w-5 mr-2 text-red-600" />
                Volatile
              </CardTitle>
              <Badge className="bg-red-100 text-red-800">15% of trends</Badge>
            </div>
            <CardDescription>Unpredictable ups and downs</CardDescription>
          </CardHeader>
          <CardContent>
            {renderTrendChart('volatile')}
            <div className="mt-4 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Avg. Time to Peak:</span>
                <span className="font-medium">Varies</span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Prediction Accuracy:</span>
                <span className="font-medium">62%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for detailed analysis */}
      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patterns">Pattern Distribution</TabsTrigger>
          <TabsTrigger value="categories">Category Analysis</TabsTrigger>
          <TabsTrigger value="predictions">Prediction Insights</TabsTrigger>
        </TabsList>
        
        {/* Pattern Distribution Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Growth Pattern Distribution</CardTitle>
              <CardDescription>
                How different growth patterns are distributed across content
              </CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              <div className="text-center bg-gray-100 w-full h-full rounded-md flex items-center justify-center">
                <div>
                  <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Growth pattern distribution chart would appear here
                    <br />
                    Showing how patterns vary across content categories
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Category Analysis Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Patterns by Category</CardTitle>
              <CardDescription>
                How growth patterns differ between content categories
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {['Product', 'Fashion', 'Food', 'Dance'].map(category => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-medium text-lg">{category}</h3>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="h-2 bg-green-500 rounded" style={{ width: `${category === 'Product' ? 60 : category === 'Fashion' ? 20 : category === 'Food' ? 10 : 40}%` }}></div>
                      <div className="h-2 bg-blue-500 rounded" style={{ width: `${category === 'Product' ? 20 : category === 'Fashion' ? 50 : category === 'Food' ? 30 : 30}%` }}></div>
                      <div className="h-2 bg-amber-500 rounded" style={{ width: `${category === 'Product' ? 15 : category === 'Fashion' ? 20 : category === 'Food' ? 50 : 20}%` }}></div>
                      <div className="h-2 bg-red-500 rounded" style={{ width: `${category === 'Product' ? 5 : category === 'Fashion' ? 10 : category === 'Food' ? 10 : 10}%` }}></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs text-gray-500">
                      <div>Exponential</div>
                      <div>Linear</div>
                      <div>Plateauing</div>
                      <div>Volatile</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Prediction Insights Tab */}
        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Prediction Insights</CardTitle>
              <CardDescription>
                Key learnings to improve prediction accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 p-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                  <h3 className="font-medium text-blue-800 mb-2">Pattern Recognition Insights</h3>
                  <ul className="list-disc pl-5 space-y-2 text-blue-700">
                    <li>Product templates show strongest correlation with exponential growth</li>
                    <li>Dance trends are most likely to exhibit viral exponential patterns</li>
                    <li>Food content typically follows plateauing growth with longer sustain period</li>
                    <li>Fashion trends tend to follow more predictable linear growth</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                  <h3 className="font-medium text-green-800 mb-2">Accuracy Improvement Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-2 text-green-700">
                    <li>Weight early engagement rates more heavily for product content</li>
                    <li>For dance content, monitor early sharing patterns for viral indicators</li>
                    <li>Food content requires longer monitoring period for accurate predictions</li>
                    <li>Add seasonal adjustment factors to fashion trend predictions</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-100 rounded-md">
                  <h3 className="font-medium text-purple-800 mb-2">Expert Input Recommendations</h3>
                  <ul className="list-disc pl-5 space-y-2 text-purple-700">
                    <li>Expert adjustments most valuable for volatile growth patterns</li>
                    <li>Early-stage exponential growth benefits from immediate expert verification</li>
                    <li>Expert input most impactful when applied within first 48 hours</li>
                    <li>Category specialists should focus on their areas of expertise</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 