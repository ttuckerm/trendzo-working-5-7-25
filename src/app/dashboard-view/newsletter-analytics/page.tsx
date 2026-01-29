'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card-component';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  Loader2, 
  Mail, 
  Calendar, 
  ArrowUpRight, 
  Users, 
  MousePointerClick, 
  ThumbsUp,
  Download,
  Search,
  Filter,
  Share2,
  Zap,
  Award
} from 'lucide-react';

// Mock data for initial rendering
const MOCK_NEWSLETTER_DATA = {
  period: '30d',
  summary: {
    clicks: 2547,
    views: 1832,
    edits: 976,
    saves: 412,
    viewToEditRate: 53.3,
    clickToEditRate: 38.3,
    editToSaveRate: 42.2,
  },
  campaigns: [
    { 
      name: 'Weekly Newsletter', 
      clicks: 1254, 
      views: 879, 
      edits: 463, 
      saves: 198,
      viewToEditRate: 52.7,
      clickToEditRate: 36.9,
      editToSaveRate: 42.8,
    },
    { 
      name: 'Tips & Tricks', 
      clicks: 842, 
      views: 612, 
      edits: 341, 
      saves: 157,
      viewToEditRate: 55.7,
      clickToEditRate: 40.5,
      editToSaveRate: 46.0,
    },
    { 
      name: 'Product Update', 
      clicks: 451, 
      views: 341, 
      edits: 172, 
      saves: 57,
      viewToEditRate: 50.4,
      clickToEditRate: 38.1,
      editToSaveRate: 33.1,
    }
  ],
  topTemplates: Array.from({ length: 5 }).map((_, i) => ({
    templateId: `template-${i + 1}`,
    name: `Template ${i + 1}`,
    clicks: Math.floor(Math.random() * 500) + 100,
    views: Math.floor(Math.random() * 300) + 50,
    edits: Math.floor(Math.random() * 150) + 20,
    saves: Math.floor(Math.random() * 80) + 10,
    totalInteractions: Math.floor(Math.random() * 1000) + 200,
    conversionRate: Math.random() * 30 + 10,
    expertCreated: i % 2 === 0
  })),
  timeSeriesData: Array.from({ length: 30 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toISOString().split('T')[0],
      clicks: Math.floor(Math.random() * 100) + 20,
      views: Math.floor(Math.random() * 80) + 15,
      edits: Math.floor(Math.random() * 40) + 5,
      saves: Math.floor(Math.random() * 20) + 2
    };
  })
};

// Content comparison data
const EXPERT_VS_AUTO_DATA = [
  { name: 'Clicks', expert: 82, automated: 58 },
  { name: 'View to Edit', expert: 64, automated: 42 },
  { name: 'Saves', expert: 48, automated: 27 },
  { name: 'Engagement', expert: 76, automated: 51 },
  { name: 'Shares', expert: 39, automated: 21 },
];

// Colors
const COLORS = {
  primary: '#3b82f6',
  secondary: '#f43f5e',
  tertiary: '#a855f7',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#0ea5e9',
  expert: '#8b5cf6',
  automated: '#ec4899'
};

/**
 * Newsletter Analytics Dashboard
 * 
 * Displays comprehensive analytics for newsletter link performance,
 * including expert vs. automated content comparison.
 */
export default function NewsletterAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [campaign, setCampaign] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(MOCK_NEWSLETTER_DATA);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Fetch newsletter analytics data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch real data
        try {
          const response = await fetch(`/api/analytics/newsletter-stats?period=${period}&campaign=${campaign}`);
          
          if (response.ok) {
            const result = await response.json();
            // Merge real data with mock data for any missing fields
            setData({
              ...MOCK_NEWSLETTER_DATA,
              ...result
            });
          } else {
            console.error('Error getting newsletter stats:', await response.text());
            // Continue with mock data
            setData(MOCK_NEWSLETTER_DATA);
          }
        } catch (error) {
          console.error('Error fetching newsletter analytics:', error);
          // Fall back to mock data
          setData(MOCK_NEWSLETTER_DATA);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period, campaign]);
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };
  
  // Calculate metrics
  const calculateMetrics = () => {
    const { summary } = data;
    return [
      {
        title: 'Total Clicks',
        value: formatNumber(summary.clicks),
        icon: <MousePointerClick className="h-5 w-5 text-blue-500" />,
        color: 'bg-blue-100'
      },
      {
        title: 'View Rate',
        value: `${((summary.views / summary.clicks) * 100).toFixed(1)}%`,
        icon: <Search className="h-5 w-5 text-purple-500" />,
        color: 'bg-purple-100'
      },
      {
        title: 'Edit Rate',
        value: `${summary.clickToEditRate.toFixed(1)}%`,
        icon: <Filter className="h-5 w-5 text-pink-500" />,
        color: 'bg-pink-100'
      },
      {
        title: 'Save Rate',
        value: `${summary.editToSaveRate.toFixed(1)}%`,
        icon: <Download className="h-5 w-5 text-green-500" />,
        color: 'bg-green-100'
      }
    ];
  };
  
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Newsletter Analytics</h1>
        <p className="text-gray-600 max-w-3xl">
          Track the performance of your newsletter campaigns and monitor the effectiveness 
          of expert vs. automated content.
        </p>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={campaign} onValueChange={setCampaign}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Campaign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All campaigns</SelectItem>
            {data.campaigns.map((c) => (
              <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <Mail className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="campaigns">
            <Calendar className="mr-2 h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="templates">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Top Templates
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <Award className="mr-2 h-4 w-4" />
            Expert vs. Automated
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {calculateMetrics().map((metric, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                      <p className="text-3xl font-bold mt-1">{metric.value}</p>
                    </div>
                    <div className={`rounded-full p-3 ${metric.color}`}>
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Newsletter Engagement Over Time</CardTitle>
                <CardDescription>Tracking clicks, views, and saves over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="clicks" 
                        stroke={COLORS.primary} 
                        name="Clicks"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="views" 
                        stroke={COLORS.tertiary} 
                        name="Views"
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="saves" 
                        stroke={COLORS.success} 
                        name="Saves"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>Newsletter to template conversion flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Clicks", value: data.summary.clicks },
                        { name: "Views", value: data.summary.views },
                        { name: "Edits", value: data.summary.edits },
                        { name: "Saves", value: data.summary.saves }
                      ]}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        fill={COLORS.primary}
                        name="Count"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-600">
                <p>Conversion rate from click to save: {((data.summary.saves / data.summary.clicks) * 100).toFixed(1)}%</p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Campaigns Tab */}
        <TabsContent value="campaigns">
          <div className="grid grid-cols-1 gap-6">
            {data.campaigns.map((campaign, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{campaign.name}</CardTitle>
                  <CardDescription>
                    Performance metrics for this campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4">Activity</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Clicks</span>
                          <span className="font-semibold">{formatNumber(campaign.clicks)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Views</span>
                          <span className="font-semibold">{formatNumber(campaign.views)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Edits</span>
                          <span className="font-semibold">{formatNumber(campaign.edits)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Saves</span>
                          <span className="font-semibold">{formatNumber(campaign.saves)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-4">Conversion Rates</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Click to View</span>
                          <span className="font-semibold">
                            {((campaign.views / campaign.clicks) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">View to Edit</span>
                          <span className="font-semibold">{campaign.viewToEditRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Edit to Save</span>
                          <span className="font-semibold">{campaign.editToSaveRate.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Overall</span>
                          <span className="font-semibold">
                            {((campaign.saves / campaign.clicks) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-64">
                      <h4 className="font-semibold mb-4">Funnel Visualization</h4>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: "Clicks", value: campaign.clicks },
                            { name: "Views", value: campaign.views },
                            { name: "Edits", value: campaign.edits },
                            { name: "Saves", value: campaign.saves }
                          ]}
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip />
                          <Bar 
                            dataKey="value" 
                            fill={COLORS.primary}
                            name="Count"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Templates</CardTitle>
              <CardDescription>
                Templates with the highest engagement from newsletter links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-sm">Template</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Type</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Clicks</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Views</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Edits</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Saves</th>
                      <th className="text-center py-3 px-4 font-semibold text-sm">Conversion</th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topTemplates.map((template, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className="font-medium">{template.name || `Template ${index + 1}`}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            template.expertCreated 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {template.expertCreated ? 'Expert' : 'Automated'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">{formatNumber(template.clicks)}</td>
                        <td className="py-3 px-4 text-center">{formatNumber(template.views)}</td>
                        <td className="py-3 px-4 text-center">{formatNumber(template.edits)}</td>
                        <td className="py-3 px-4 text-center">{formatNumber(template.saves)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${
                            template.conversionRate > 20 
                              ? 'text-green-600' 
                              : template.conversionRate > 10 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                          }`}>
                            {template.conversionRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/dashboard-view/templates/${template.templateId}`)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Expert vs. Automated Comparison Tab */}
        <TabsContent value="comparison">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Expert vs. Automated Content</CardTitle>
                <CardDescription>Performance comparison between expert-created and AI-generated templates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={EXPERT_VS_AUTO_DATA}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="expert" name="Expert" fill={COLORS.expert} />
                      <Bar dataKey="automated" name="Automated" fill={COLORS.automated} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-600">
                <p>Expert-created content shows consistently higher performance across metrics</p>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Content Performance Analysis</CardTitle>
                <CardDescription>Key insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-md">
                    <h4 className="font-semibold flex items-center text-blue-800">
                      <Zap className="h-5 w-5 mr-2" />
                      Key Insights
                    </h4>
                    <ul className="mt-2 space-y-2 text-blue-700">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Expert-created content shows 41% higher conversion rates</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Automated content performs better in high-volume, standardized campaigns</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Hybrid approaches (expert-refined auto-content) show promising results</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-md">
                    <h4 className="font-semibold flex items-center text-purple-800">
                      <Award className="h-5 w-5 mr-2" />
                      Expert Content Strengths
                    </h4>
                    <ul className="mt-2 space-y-2 text-purple-700">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Higher emotional engagement and personalization</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>More effective for complex or nuanced campaigns</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Better retention rates and recurring engagement</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-pink-50 rounded-md">
                    <h4 className="font-semibold flex items-center text-pink-800">
                      <Share2 className="h-5 w-5 mr-2" />
                      Automated Content Opportunities
                    </h4>
                    <ul className="mt-2 space-y-2 text-pink-700">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Excellent for high-volume, repetitive content needs</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Cost-effective for broad audience targeting</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Performance improving with each iteration and feedback cycle</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 