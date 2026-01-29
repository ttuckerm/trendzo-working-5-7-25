"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, Lock, TrendingUp, Eye, Clock, ChevronRight, Mail } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import LoadingFallback from '@/components/ui/LoadingFallback';
import Link from 'next/link';

interface TemplatePreview {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  duration: number;
  views: number;
  stats?: {
    likes?: number;
    comments?: number;
    engagementRate?: number;
  };
}

export default function TemplatePreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id');
  const source = searchParams.get('source') || 'direct';
  const campaign = searchParams.get('campaign') || '';
  
  const [template, setTemplate] = useState<TemplatePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromNewsletter, setIsFromNewsletter] = useState(false);
  const [newsletterName, setNewsletterName] = useState('');
  
  const { user, signInWithGoogle } = useAuth();
  
  // Check source parameters
  useEffect(() => {
    if (source === 'newsletter') {
      setIsFromNewsletter(true);
      // Get readable campaign name from campaign parameter
      if (campaign) {
        const formattedName = campaign
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        setNewsletterName(formattedName);
      } else {
        setNewsletterName('Our Newsletter');
      }
    }
  }, [source, campaign]);
  
  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      // If user is already authenticated, redirect to editor with context
      const params = new URLSearchParams();
      params.append('id', templateId || '');
      params.append('source', source);
      if (campaign) params.append('campaign', campaign);
      
      router.push(`/editor?${params.toString()}`);
    }
  }, [user, templateId, source, campaign, router]);
  
  // Fetch template data
  useEffect(() => {
    const fetchTemplateData = async () => {
      if (!templateId) {
        setError('Template ID is required');
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/templates/${templateId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch template data');
        }
        
        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        console.error('Error fetching template:', err);
        setError('Failed to load template preview. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplateData();
  }, [templateId]);
  
  // Handle sign in and redirect to editor
  const handleSignIn = async () => {
    try {
      // Store template context in localStorage before auth
      if (templateId) {
        localStorage.setItem('pendingTemplateId', templateId);
        localStorage.setItem('templateSource', source);
        if (campaign) localStorage.setItem('templateCampaign', campaign);
      }
      
      await signInWithGoogle();
      // The auth state change will trigger the useEffect above
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
    }
  };
  
  if (isLoading) {
    return <LoadingFallback />;
  }
  
  if (error) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <Lock size={48} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Template</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/templates')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Templates
          </button>
        </div>
      </div>
    );
  }
  
  if (!template) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-yellow-500 mb-4">
            <Lock size={48} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the template you're looking for.</p>
          <button
            onClick={() => router.push('/templates')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Templates
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isFromNewsletter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center">
            <Mail className="text-blue-500 mr-3 flex-shrink-0" />
            <div>
              <h2 className="font-medium text-blue-700">Newsletter Template</h2>
              <p className="text-sm text-blue-600">
                You're viewing this template from {newsletterName}. Sign in to edit and use it.
              </p>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Preview Header */}
          <div className="relative h-64 sm:h-80 md:h-96 bg-gray-200">
            {template.thumbnailUrl ? (
              <Image
                src={template.thumbnailUrl}
                alt={template.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-gray-500">Preview not available</p>
              </div>
            )}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {template.category || 'Template'}
              </span>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center text-white">
                <Lock size={32} className="mx-auto mb-2" />
                <p className="text-sm font-medium">Sign in to access this template</p>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{template.title}</h1>
            
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex items-center text-sm text-gray-500">
                <Eye size={16} className="mr-1" />
                {template.views >= 1000000 
                  ? `${(template.views / 1000000).toFixed(1)}M views` 
                  : template.views >= 1000 
                  ? `${(template.views / 1000).toFixed(1)}K views` 
                  : `${template.views} views`}
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Clock size={16} className="mr-1" />
                {Math.floor(template.duration / 60)}:{(template.duration % 60).toString().padStart(2, '0')}
              </div>
              
              {template.stats?.engagementRate && (
                <div className="flex items-center text-sm text-green-600">
                  <TrendingUp size={16} className="mr-1" />
                  {(template.stats.engagementRate * 100).toFixed(1)}% engagement
                </div>
              )}
            </div>
            
            <p className="text-gray-600 mb-6">{template.description}</p>
            
            {/* Benefits Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Why use this template?</h2>
              <ul className="space-y-2">
                <li className="flex">
                  <ChevronRight size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-2 text-gray-600">Save time with ready-to-use professional structure</span>
                </li>
                <li className="flex">
                  <ChevronRight size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-2 text-gray-600">Based on trending successful TikTok formats</span>
                </li>
                <li className="flex">
                  <ChevronRight size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="ml-2 text-gray-600">Customize everything to match your brand</span>
                </li>
                {isFromNewsletter && (
                  <li className="flex">
                    <ChevronRight size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-2 text-gray-600">Recommended template from {newsletterName}</span>
                  </li>
                )}
              </ul>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleSignIn}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Sign in to Edit Template
                <ArrowRight size={18} className="ml-2" />
              </button>
              
              <button
                onClick={() => router.push('/templates')}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-800 rounded-md font-medium hover:bg-gray-200 transition-colors"
              >
                Browse More Templates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 