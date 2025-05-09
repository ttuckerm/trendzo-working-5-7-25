"use client";

import { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw, ExternalLink, TrendingUp, Eye, Edit3 } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, where, DocumentData, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

interface Template {
  id: string;
  title: string;
  category: string;
  views?: number;
  createdAt?: string;
  thumbnailUrl?: string;
}

interface AnalyticsSummary {
  totalClicks: number;
  totalConversions: number;
  totalTemplateUsage: number;
  conversionRate: number;
}

export default function NewsletterLinkGenerator() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('popular');
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary>({
    totalClicks: 0,
    totalConversions: 0,
    totalTemplateUsage: 0,
    conversionRate: 0
  });

  // Domain configuration - Fix to use window.location for proper domain instead of env variable
  const getDomain = () => {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}`;
    }
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  };

  const domain = getDomain();

  // Fetch templates from Firestore
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check if db is available
        const firestore = db as Firestore | null;
        if (!firestore) {
          throw new Error('Firebase DB is not initialized');
        }
        
        let templateQuery;
        
        if (sortBy === 'latest') {
          // Sort by creation date, newest first
          templateQuery = query(
            collection(firestore, 'templates'),
            orderBy('createdAt', 'desc'),
            limit(20)
          );
        } else {
          // Sort by views, highest first
          templateQuery = query(
            collection(firestore, 'templates'),
            orderBy('views', 'desc'),
            limit(20)
          );
        }

        const templatesSnapshot = await getDocs(templateQuery);
        
        const templatesData = templatesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.().toISOString() || new Date().toISOString()
        })) as Template[];

        setTemplates(templatesData);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to load templates. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [sortBy]);
  
  // Fetch analytics summary
  useEffect(() => {
    const fetchAnalyticsSummary = async () => {
      try {
        // Check if db is available
        const firestore = db as Firestore | null;
        if (!firestore) {
          console.error('Firebase DB is not initialized');
          return;
        }
        
        // Get newsletter clicks
        const clicksQuery = query(
          collection(firestore, 'template_analytics'),
          where('source', '==', 'newsletter')
        );
        const clicksSnapshot = await getDocs(clicksQuery);
        const totalClicks = clicksSnapshot.size;
        
        // Get conversions (where action is 'open_editor')
        const conversionsQuery = query(
          collection(firestore, 'template_analytics'),
          where('source', '==', 'newsletter'),
          where('action', '==', 'open_editor')
        );
        const conversionsSnapshot = await getDocs(conversionsQuery);
        const totalConversions = conversionsSnapshot.size;
        
        // Get template usage (where action is 'save_template')
        const usageQuery = query(
          collection(firestore, 'template_analytics'),
          where('source', '==', 'newsletter'),
          where('action', '==', 'save_template')
        );
        const usageSnapshot = await getDocs(usageQuery);
        const totalTemplateUsage = usageSnapshot.size;
        
        // Calculate conversion rate
        const conversionRate = totalClicks > 0 
          ? (totalConversions / totalClicks) * 100
          : 0;
        
        setAnalyticsSummary({
          totalClicks,
          totalConversions,
          totalTemplateUsage,
          conversionRate
        });
      } catch (err) {
        console.error('Error fetching analytics summary:', err);
        // Don't show error to user, just log it
      }
    };
    
    fetchAnalyticsSummary();
  }, []);

  // Generate newsletter link
  const generateLink = () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    const baseUrl = `${domain}/api/template-redirect`;
    const params = new URLSearchParams();
    
    params.append('id', selectedTemplate);
    params.append('source', 'newsletter');
    
    if (campaignName) {
      params.append('campaign', campaignName.trim().replace(/\s+/g, '-').toLowerCase());
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    setGeneratedLink(url);
    setError(null);
  };
  
  // Generate direct link (bypassing the redirect API)
  const generateDirectLink = () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }
    
    const baseUrl = `${domain}/template-preview`;
    const params = new URLSearchParams();
    
    params.append('id', selectedTemplate);
    params.append('source', 'newsletter');
    
    if (campaignName) {
      params.append('campaign', campaignName.trim().replace(/\s+/g, '-').toLowerCase());
    }
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Copy link to clipboard
  const copyToClipboard = async () => {
    if (!generatedLink) return;
    
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('Failed to copy to clipboard. Please try manually.');
    }
  };

  // Test the link
  const testLink = () => {
    if (!generatedLink) return;
    
    try {
      // Log the test action for analytics
      console.log('Testing newsletter link:', generatedLink);
      
      // Open link in new tab
      window.open(generatedLink, '_blank');
      
      // Show toast or alert if available in the UI
      // This is useful for local development testing
      if (process.env.NODE_ENV === 'development') {
        console.log('Link test triggered. If redirect doesn\'t work, verify the /api/template-redirect endpoint.');
      }
    } catch (err) {
      console.error('Error opening test link:', err);
      setError('Failed to open test link. Please try manually.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-1">
            <Eye size={16} className="text-blue-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Total Clicks</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analyticsSummary.totalClicks}</p>
          <p className="text-xs text-gray-500 mt-1">From all newsletter campaigns</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-1">
            <Edit3 size={16} className="text-green-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Editor Opens</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analyticsSummary.totalConversions}</p>
          <p className="text-xs text-gray-500 mt-1">Templates opened in editor</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-1">
            <TrendingUp size={16} className="text-purple-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Conversion Rate</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analyticsSummary.conversionRate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">Clicks to editor opens</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center mb-1">
            <Check size={16} className="text-amber-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-700">Templates Used</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{analyticsSummary.totalTemplateUsage}</p>
          <p className="text-xs text-gray-500 mt-1">Templates saved from newsletter</p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Newsletter Link Generator</h2>
        
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {/* Sort controls */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort templates by</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                sortBy === 'latest'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-3 py-1.5 text-sm rounded-md ${
                sortBy === 'popular'
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              Most Popular
            </button>
          </div>
        </div>
        
        {/* Template selection */}
        <div className="mb-4">
          <label htmlFor="template-select" className="block text-sm font-medium text-gray-700 mb-1">
            Select Template
          </label>
          <div className="relative">
            {loading ? (
              <div className="w-full p-2.5 bg-gray-100 rounded-md flex items-center">
                <RefreshCw size={16} className="text-gray-400 animate-spin mr-2" />
                <span className="text-gray-500">Loading templates...</span>
              </div>
            ) : (
              <select
                id="template-select"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select a template --</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title} ({template.category})
                    {template.views ? ` - ${template.views.toLocaleString()} views` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        {/* Campaign name input */}
        <div className="mb-6">
          <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-700 mb-1">
            Campaign Name (optional)
          </label>
          <input
            type="text"
            id="campaign-name"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g. april-newsletter, spring-promotion"
            className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Used for tracking this specific newsletter campaign
          </p>
        </div>
        
        {/* Generate button */}
        <button
          onClick={generateLink}
          disabled={loading}
          className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          Generate Newsletter Link
        </button>
        
        {/* Generated link display */}
        {generatedLink && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generated Link
            </label>
            <div className="flex">
              <div className="flex-grow bg-gray-50 border border-gray-300 rounded-l-md p-2.5 overflow-x-auto whitespace-nowrap text-sm text-gray-800">
                {generatedLink}
              </div>
              <button
                onClick={copyToClipboard}
                className="px-3 bg-gray-100 border-t border-r border-b border-gray-300 rounded-r-md hover:bg-gray-200 transition-colors flex items-center justify-center"
                title="Copy to clipboard"
              >
                {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} className="text-gray-600" />}
              </button>
            </div>
            
            <div className="flex justify-between mt-2">
              <div>
                <button
                  onClick={() => {
                    const directLink = generateDirectLink();
                    window.open(directLink, '_blank');
                  }}
                  className="flex items-center text-sm text-purple-600 hover:text-purple-800"
                >
                  <ExternalLink size={14} className="mr-1" />
                  Direct Preview Link
                </button>
              </div>
              <button
                onClick={testLink}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <ExternalLink size={14} className="mr-1" />
                Test redirect link
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Template List Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Trending Templates</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.slice(0, 5).map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {template.thumbnailUrl && (
                        <div className="flex-shrink-0 h-10 w-10 mr-3">
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={template.thumbnailUrl} 
                            alt="" 
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{template.title}</div>
                        <div className="text-xs text-gray-500">ID: {template.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {template.views ? (
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye size={14} className="mr-1" />
                        {template.views.toLocaleString()} views
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">No data</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        generateLink();
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Generate Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 