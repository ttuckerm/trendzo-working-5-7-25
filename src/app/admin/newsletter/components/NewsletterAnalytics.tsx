"use client";

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { doc, getDoc, collection, query, where, getDocs, Firestore, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Inbox, BarChart2, PieChart as PieChartIcon, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

// Types
interface NewsletterLinkAnalytics {
  id: string;
  templateId: string;
  templateName: string;
  clicks: number;
  views: number;
  edits: number;
  conversions: number;
  conversionRate: number;
  campaignId: string;
  createdAt: string;
  lastClickedAt: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

interface CampaignData {
  name: string;
  clicks: number;
  views: number;
  edits: number;
  conversions: number;
  conversionRate: number;
}

interface AnalyticsProps {
  linkId?: string;
  templateId?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A259FF', '#4BC0C0'];

export default function NewsletterAnalytics({ linkId, templateId }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<NewsletterLinkAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignData[]>([]);
  const [topTemplates, setTopTemplates] = useState<{name: string, value: number}[]>([]);
  const [dateRangeData, setDateRangeData] = useState<{date: string, clicks: number, views: number}[]>([]);
  
  // Fetch analytics data
  useEffect(() => {
    async function fetchAnalytics() {
      if (!db) {
        setError('Firestore not initialized');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        if (linkId) {
          // Fetch analytics for a specific link
          const linkRef = doc(db, 'newsletterLinks', linkId);
          const linkDoc = await getDoc(linkRef);
          
          if (linkDoc.exists()) {
            const linkData = linkDoc.data();
            
            // Get associated template analytics if available
            const templateRef = doc(db, 'newsletterAnalytics', linkData.templateId);
            const templateDoc = await getDoc(templateRef);
            
            const templateAnalytics = templateDoc.exists() ? templateDoc.data() : { views: 0, edits: 0, conversions: 0 };
            
            // Get click data
            const clicksQuery = query(
              collection(db, 'newsletterClicks'),
              where('linkId', '==', linkId)
            );
            const clicksSnapshot = await getDocs(clicksQuery);
            
            // Compile analytics data
            setAnalytics({
              id: linkId,
              templateId: linkData.templateId,
              templateName: linkData.templateName || 'Unknown Template',
              clicks: linkData.clicks || 0,
              views: templateAnalytics.views || 0,
              edits: templateAnalytics.edits || 0,
              conversions: templateAnalytics.conversions || 0,
              conversionRate: templateAnalytics.views > 0 
                ? (templateAnalytics.conversions / templateAnalytics.views) * 100 
                : 0,
              campaignId: linkData.campaignId || 'weekly',
              createdAt: linkData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              lastClickedAt: linkData.lastClickedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              utmSource: linkData.utmSource || 'newsletter',
              utmMedium: linkData.utmMedium || 'email',
              utmCampaign: linkData.utmCampaign || linkData.campaignId || 'weekly',
            });
          } else {
            setError(`Newsletter link with ID ${linkId} not found`);
          }
        } else if (templateId) {
          // Fetch analytics for a specific template
          const templateRef = doc(db, 'newsletterAnalytics', templateId);
          const templateDoc = await getDoc(templateRef);
          
          if (templateDoc.exists()) {
            const templateData = templateDoc.data();
            
            // Get template details
            const templateDetailsRef = doc(db, 'templates', templateId);
            const templateDetailsDoc = await getDoc(templateDetailsRef);
            const templateName = templateDetailsDoc.exists() 
              ? templateDetailsDoc.data().title || 'Unknown Template'
              : 'Unknown Template';
            
            // Compile analytics data
            setAnalytics({
              id: templateId,
              templateId: templateId,
              templateName: templateName,
              clicks: 0, // We don't have aggregated clicks for all links to this template
              views: templateData.views || 0,
              edits: templateData.edits || 0,
              conversions: templateData.conversions || 0,
              conversionRate: templateData.views > 0 
                ? (templateData.conversions / templateData.views) * 100 
                : 0,
              campaignId: '',
              createdAt: templateData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              lastClickedAt: templateData.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
              utmSource: '',
              utmMedium: '',
              utmCampaign: '',
            });
          } else {
            setError(`Template analytics for ID ${templateId} not found`);
          }
        } else {
          // Fetch overall newsletter analytics
          await fetchCampaignData();
          await fetchTopTemplates();
          await fetchDateRangeData();
        }
      } catch (err) {
        console.error('Error fetching newsletter analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [linkId, templateId]);
  
  // Fetch campaign performance data
  async function fetchCampaignData() {
    if (!db) return;
    
    try {
      // This would normally query the database for campaign data
      // Simulating with sample data for now
      setCampaignData([
        { name: 'April Newsletter', clicks: 1245, views: 843, edits: 312, conversions: 98, conversionRate: 11.6 },
        { name: 'Product Launch', clicks: 3541, views: 2104, edits: 987, conversions: 421, conversionRate: 20.0 },
        { name: 'Summer Sale', clicks: 2187, views: 1432, edits: 576, conversions: 210, conversionRate: 14.7 },
        { name: 'Weekly Update', clicks: 954, views: 621, edits: 201, conversions: 87, conversionRate: 14.0 },
        { name: 'Holiday Special', clicks: 1823, views: 1190, edits: 413, conversions: 156, conversionRate: 13.1 }
      ]);
    } catch (err) {
      console.error('Error fetching campaign data:', err);
    }
  }
  
  // Fetch top performing templates
  async function fetchTopTemplates() {
    if (!db) return;
    
    try {
      // In a real implementation, this would fetch from Firestore
      // For now, using sample data
      setTopTemplates([
        { name: 'Product Showcase', value: 35 },
        { name: 'Customer Testimonial', value: 25 },
        { name: 'Brand Story', value: 20 },
        { name: 'Sale Promotion', value: 15 },
        { name: 'Tutorial Video', value: 5 }
      ]);
    } catch (err) {
      console.error('Error fetching top templates:', err);
    }
  }
  
  // Fetch date range data for time-series chart
  async function fetchDateRangeData() {
    if (!db) return;
    
    try {
      // In a real implementation, this would fetch from Firestore
      // For now, using sample data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          clicks: Math.floor(Math.random() * 500) + 100,
          views: Math.floor(Math.random() * 300) + 50
        };
      }).reverse();
      
      setDateRangeData(last7Days);
    } catch (err) {
      console.error('Error fetching date range data:', err);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading analytics data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg">
        <p className="font-medium">Error: {error}</p>
      </div>
    );
  }

  // If we're looking at a specific link or template
  if (analytics) {
    // Prepare chart data
    const chartData = [
      {
        name: 'Clicks',
        value: analytics.clicks,
        fill: '#3b82f6',
      },
      {
        name: 'Views',
        value: analytics.views,
        fill: '#10b981',
      },
      {
        name: 'Edits',
        value: analytics.edits,
        fill: '#8b5cf6',
      },
      {
        name: 'Conversions',
        value: analytics.conversions,
        fill: '#f59e0b',
      },
    ];

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          {linkId ? 'Newsletter Link Analytics' : 'Template Analytics'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="text-sm text-blue-800">Clicks</div>
            <div className="text-2xl font-bold text-blue-700">{analytics.clicks.toLocaleString()}</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="text-sm text-green-800">Views</div>
            <div className="text-2xl font-bold text-green-700">{analytics.views.toLocaleString()}</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="text-sm text-purple-800">Editor Opens</div>
            <div className="text-2xl font-bold text-purple-700">{analytics.edits.toLocaleString()}</div>
          </div>
          
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="text-sm text-amber-800">Conversion Rate</div>
            <div className="text-2xl font-bold text-amber-700">
              {analytics.conversionRate.toFixed(1)}%
            </div>
          </div>
        </div>
        
        <div className="h-80 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Bar dataKey="value" nameKey="name" fill="fill" label={{ position: 'right', fill: '#666' }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-700 mb-2">Additional Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Template Name: <span className="text-gray-900">{analytics.templateName}</span></p>
              <p className="text-gray-500">Template ID: <span className="text-gray-900">{analytics.templateId}</span></p>
              {analytics.campaignId && (
                <p className="text-gray-500">Campaign: <span className="text-gray-900">{analytics.campaignId}</span></p>
              )}
            </div>
            <div>
              <p className="text-gray-500">Created: <span className="text-gray-900">{new Date(analytics.createdAt).toLocaleString()}</span></p>
              <p className="text-gray-500">Last Activity: <span className="text-gray-900">{new Date(analytics.lastClickedAt).toLocaleString()}</span></p>
              {analytics.utmSource && (
                <p className="text-gray-500">Source: <span className="text-gray-900">{analytics.utmSource}</span></p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Dashboard view - overall newsletter analytics
  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaignData.reduce((acc, curr) => acc + curr.clicks, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Inbox size={20} className="text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpRight size={14} className="text-green-500 mr-1" />
            <span className="text-green-600 font-medium">8.2%</span>
            <span className="text-gray-500 ml-1">vs. last month</span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Templates Used</p>
              <p className="text-2xl font-bold text-gray-900">
                {campaignData.reduce((acc, curr) => acc + curr.conversions, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <BarChart2 size={20} className="text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpRight size={14} className="text-green-500 mr-1" />
            <span className="text-green-600 font-medium">12.1%</span>
            <span className="text-gray-500 ml-1">vs. last month</span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(campaignData.reduce((acc, curr) => acc + curr.conversionRate, 0) / campaignData.length).toFixed(1)}%
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowDownRight size={14} className="text-red-500 mr-1" />
            <span className="text-red-600 font-medium">1.4%</span>
            <span className="text-gray-500 ml-1">vs. last month</span>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{campaignData.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <CalendarDays size={20} className="text-amber-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <ArrowUpRight size={14} className="text-green-500 mr-1" />
            <span className="text-green-600 font-medium">2</span>
            <span className="text-gray-500 ml-1">new this month</span>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="performance">
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance" className="space-y-6">
          {/* Time Series Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dateRangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="clicks" stroke="#3b82f6" name="Clicks" strokeWidth={2} />
                  <Line type="monotone" dataKey="views" stroke="#10b981" name="Views" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Template Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Template Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topTemplates}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {topTemplates.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Performing Templates</h4>
                <div className="space-y-3">
                  {topTemplates.map((template, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-800">{template.name}</span>
                          <span className="text-sm font-medium text-gray-900">{template.value}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1">
                          <div className="h-1.5 rounded-full" 
                               style={{ 
                                 width: `${template.value}%`, 
                                 backgroundColor: COLORS[index % COLORS.length] 
                               }}>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns">
          {/* Campaign Table */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Edits
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conversions
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaignData.map((campaign, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{campaign.clicks.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{campaign.views.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{campaign.edits.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{campaign.conversions.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">{campaign.conversionRate.toFixed(1)}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Campaign Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Comparison</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="clicks" fill="#3b82f6" name="Clicks" />
                  <Bar dataKey="views" fill="#10b981" name="Views" />
                  <Bar dataKey="conversions" fill="#f59e0b" name="Conversions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Template Performance</h3>
            <p className="text-gray-600 mb-8">
              Detailed template usage analytics from newsletter campaigns will be available here.
            </p>
            
            <div className="p-12 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
              <div className="text-center">
                <PieChartIcon size={36} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  Detailed template analytics coming soon.<br />
                  <span className="text-sm">Track which templates perform best in newsletter campaigns.</span>
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 