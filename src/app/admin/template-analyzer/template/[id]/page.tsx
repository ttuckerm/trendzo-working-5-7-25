'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { TrendingTemplate } from '@/lib/types/trendingTemplate';

export default function TemplateDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const templateId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  
  const [template, setTemplate] = useState<TrendingTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTemplateDetails() {
      if (!templateId) {
        setError('No template ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const templateRef = doc(db, 'templates', templateId);
        const templateDoc = await getDoc(templateRef);
        
        if (templateDoc.exists()) {
          setTemplate({ id: templateDoc.id, ...templateDoc.data() } as TrendingTemplate);
          setError(null);
        } else {
          setError(`Template with ID ${templateId} not found`);
          setTemplate(null);
        }
      } catch (err) {
        console.error('Error fetching template details:', err);
        setError('Failed to load template details. Check console for details.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchTemplateDetails();
  }, [templateId]);

  // Format date string
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Loading Template...</h1>
        </div>
        <div className="mt-8 flex items-center justify-center">
          <div className="animate-spin h-10 w-10 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold">Template Error</h1>
        </div>
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => router.push('/admin/template-analyzer')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Return to Template Analyzer
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mr-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Template Details</h1>
      </div>

      {/* Template header */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-start">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
              {template.category}
            </span>
            <h2 className="text-xl font-semibold">{template.title}</h2>
            <p className="text-gray-500 mt-1">ID: {template.id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Created: {formatDate(template.createdAt)}</p>
            <p className="text-sm text-gray-500">Updated: {formatDate(template.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Template structure */}
        <div className="bg-white p-6 rounded-lg shadow col-span-2">
          <h3 className="text-lg font-medium mb-4">Template Structure</h3>
          <div className="space-y-2">
            {template.templateStructure.map((section, index) => (
              <div key={section.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">
                    Section {index + 1}: {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {section.startTime}s - {section.startTime + section.duration}s ({section.duration}s)
                  </span>
                </div>
                {section.textOverlays.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Text Overlays:</p>
                    <ul className="list-disc list-inside text-sm">
                      {section.textOverlays.map((overlay) => (
                        <li key={overlay.id}>{overlay.text}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No text overlays in this section</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Template stats */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Engagement Statistics</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Views</span>
                  <span className="font-medium">{template.stats.views.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Likes</span>
                  <span className="font-medium">{template.stats.likes.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (template.stats.likes / template.stats.views) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Comments</span>
                  <span className="font-medium">{template.stats.comments.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (template.stats.comments / template.stats.views) * 100 * 10)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Shares</span>
                  <span className="font-medium">{template.stats.shares.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (template.stats.shares / template.stats.views) * 100 * 20)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Engagement Rate</span>
                <span className="font-medium text-green-600">{template.stats.engagementRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Author info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Creator Info</h3>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {template.authorInfo.username.charAt(0).toUpperCase()}
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <span className="font-medium">{template.authorInfo.username}</span>
                  {template.authorInfo.isVerified && (
                    <span className="ml-1 text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Creator ID: {template.authorInfo.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis data */}
      {template.analysisData && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-medium mb-4">Analysis Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Detected Elements</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <ul className="space-y-2">
                  {Object.entries(template.analysisData.detectedElements).map(([key, value]) => (
                    <li key={key} className="flex items-center">
                      {value ? (
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Engagement Insights</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">{template.analysisData.engagementInsights || 'No engagement insights available'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Similar templates */}
      {template.trendData.similarTemplates && template.trendData.similarTemplates.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-medium mb-4">Similar Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {template.trendData.similarTemplates.map((similarTemplateId) => (
              <div key={similarTemplateId} className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow transition cursor-pointer">
                <p className="font-medium">{similarTemplateId}</p>
                <button
                  onClick={() => router.push(`/admin/template-analyzer/template/${similarTemplateId}`)}
                  className="text-blue-600 text-sm mt-2 hover:text-blue-800"
                >
                  View Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 