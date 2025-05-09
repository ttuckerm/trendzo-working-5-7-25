"use client";

import React from 'react';
import FeatureGatedTemplateBrowser from '@/components/templates/FeatureGatedTemplateBrowser';
import { useFeatures } from '@/lib/contexts/FeatureContext';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TrendingUp, Music, Star, Lock } from 'lucide-react';
import Link from 'next/link';

/**
 * Templates browsing page
 * Allows users to search and browse through available templates
 */
export default function TemplatesBrowserPage() {
  const { subscription } = useFeatures();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Subscription tier banner */}
      {subscription === 'free' && (
        <Alert className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex md:items-center md:justify-between flex-col md:flex-row gap-4">
            <div>
              <AlertTitle className="flex items-center text-blue-700">
                <Lock className="h-4 w-4 mr-2" />
                Upgrade to Premium for Enhanced Features
              </AlertTitle>
              <AlertDescription className="text-blue-600">
                Unlock premium analytics, template remixing, and more with a Premium subscription.
              </AlertDescription>
            </div>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/pricing">View Premium Plans</Link>
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Feature highlights based on subscription */}
      {subscription && subscription !== 'free' && (
        <div className="mb-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-800">Advanced Analytics</h3>
                    <p className="text-sm text-purple-600">Track template performance with detailed metrics</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-teal-50 border border-blue-100 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Music className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">Sound Analysis</h3>
                    <p className="text-sm text-blue-600">Discover trending sounds and optimal pairings</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-amber-800">Expert Insights</h3>
                    <p className="text-sm text-amber-600">Get recommendations from content experts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Template Browser */}
      <FeatureGatedTemplateBrowser />
    </div>
  );
} 