"use client"

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import NewsletterLinkGenerator from './components/NewsletterLinkGenerator'
import NewsletterAnalytics from './components/NewsletterAnalytics'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card-component'
import { Separator } from '@/components/ui/separator'
import { Music, TrendingUp, Wand2, LineChart, RefreshCw, AlertTriangle } from 'lucide-react'
import WeeklyTrendingSounds from '@/components/newsletter/WeeklyTrendingSounds'
import { newsletterSoundService } from '@/lib/services/newsletterSoundService'
import { WeeklyTrendingSoundsShowcase } from '@/lib/types/newsletter'
import Link from 'next/link'

export default function AdminNewsletterPage() {
  const [appUrl, setAppUrl] = useState<string>('');
  const [weeklyShowcase, setWeeklyShowcase] = useState<WeeklyTrendingSoundsShowcase | null>(null);
  const [loadingShowcase, setLoadingShowcase] = useState<boolean>(false);
  const [refreshingShowcase, setRefreshingShowcase] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('link-generator');
  const [showcaseError, setShowcaseError] = useState<string | null>(null);

  // Get debug info
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
  }, []);

  // Fetch showcase data when the sounds tab becomes active
  useEffect(() => {
    if (activeTab === 'sounds' && !weeklyShowcase && !loadingShowcase) {
      fetchWeeklyShowcase();
    }
  }, [activeTab, weeklyShowcase, loadingShowcase]);

  const fetchWeeklyShowcase = async (generateNew = false) => {
    try {
      setShowcaseError(null);
      
      if (generateNew) {
        setRefreshingShowcase(true);
      } else {
        setLoadingShowcase(true);
      }
      
      const response = await fetch(`/api/newsletter/weekly-sounds${generateNew ? '?generateNew=true' : ''}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch weekly sounds showcase (${response.status})`);
      }
      
      const data = await response.json();
      
      if (data.success && data.showcase) {
        setWeeklyShowcase(data.showcase);
      } else {
        console.error('No showcase found in the response:', data);
        setShowcaseError(data.error || 'No showcase data available');
      }
    } catch (error: any) {
      console.error('Error fetching weekly showcase:', error);
      setShowcaseError(error.message || 'Error loading weekly showcase');
    } finally {
      setLoadingShowcase(false);
      setRefreshingShowcase(false);
    }
  };
  
  const handleRefreshShowcase = () => {
    fetchWeeklyShowcase(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Newsletter Management</h1>
        <p className="text-gray-600">
          Create and manage newsletter integrations for template distribution
        </p>
      </div>

      <Tabs defaultValue="link-generator" onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="link-generator">Link Generator</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="sounds">Sound Features</TabsTrigger>
          <TabsTrigger value="templates">Newsletter Templates</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>
        
        <TabsContent value="link-generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <NewsletterLinkGenerator />
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Links</CardTitle>
                  <CardDescription>
                    Access frequently used pages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/test-newsletter">
                      Test Newsletter Page
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/sounds">
                      Sounds Dashboard
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 list-disc pl-5 text-sm">
                    <li>Use link tokens to track user engagement</li>
                    <li>Add template recommendations to newsletters</li>
                    <li>View analytics for newsletter campaigns</li>
                    <li>Configure newsletter templates</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <NewsletterAnalytics />
        </TabsContent>
        
        <TabsContent value="sounds" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Music className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Weekly Trending Sounds</CardTitle>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshShowcase}
                    disabled={refreshingShowcase || loadingShowcase}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshingShowcase ? 'animate-spin' : ''}`} />
                    {refreshingShowcase ? 'Refreshing...' : 'Refresh Data'}
                  </Button>
                </div>
                <CardDescription>
                  Weekly showcase of trending sounds for newsletter integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingShowcase ? (
                  <div className="py-12 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : showcaseError ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
                    <p className="text-muted-foreground mb-4">{showcaseError}</p>
                    <Button variant="outline" size="sm" onClick={() => fetchWeeklyShowcase()}>
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <WeeklyTrendingSounds showcase={weeklyShowcase || undefined} />
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Last updated: {weeklyShowcase?.date ? new Date(weeklyShowcase.date).toLocaleDateString() : 'Never'}
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/test-newsletter">
                    Test in Newsletter
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <Wand2 className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Template-Sound Pairings</CardTitle>
                  </div>
                  <CardDescription>
                    AI-powered recommendations for template-sound pairings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Featured Templates with Sound Recommendations</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between">
                        <span>Dance Challenge Template</span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/test-newsletter">View Pairings</Link>
                        </Button>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Product Showcase Template</span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/test-newsletter">View Pairings</Link>
                        </Button>
                      </li>
                      <li className="flex items-center justify-between">
                        <span>Story Time Template</span>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/test-newsletter">View Pairings</Link>
                        </Button>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            
              <Card>
                <CardHeader>
                  <div className="flex items-center">
                    <LineChart className="w-5 h-5 mr-2 text-primary" />
                    <CardTitle>Sound Performance Tracking</CardTitle>
                  </div>
                  <CardDescription>
                    Track user engagement with sounds from newsletters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium">Total Sound Selections</div>
                        <div className="text-2xl font-bold">327</div>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">Top Sound</div>
                        <div className="font-medium">Summer Beat</div>
                        <div className="text-sm text-muted-foreground">142 selections</div>
                      </div>
                      
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium mb-1">Top Template</div>
                        <div className="font-medium">Dance Challenge</div>
                        <div className="text-sm text-muted-foreground">89 selections</div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <Button className="w-full" asChild>
                      <Link href="/sounds/analytics">
                        View Full Analytics
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Newsletter Sound Integration Features</CardTitle>
              <CardDescription>
                Enhance your newsletters with these sound-related features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4">
                  <h3 className="flex items-center font-medium mb-2">
                    <Music className="h-5 w-5 mr-2 text-primary" />
                    Weekly Trending Sounds
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Showcase weekly trending sounds to keep your audience engaged with the latest audio content.
                  </p>
                  <div className="text-sm">
                    <span className="text-green-600">✓</span> Automatically updates weekly
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="flex items-center font-medium mb-2">
                    <Wand2 className="h-5 w-5 mr-2 text-primary" />
                    Sound-Template Pairing
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    AI-powered recommendations for the perfect sound to match each template.
                  </p>
                  <div className="text-sm">
                    <span className="text-green-600">✓</span> Increases template usage
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="flex items-center font-medium mb-2">
                    <LineChart className="h-5 w-5 mr-2 text-primary" />
                    Performance Tracking
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track which sounds are most popular and drive the highest engagement.
                  </p>
                  <div className="text-sm">
                    <span className="text-green-600">✓</span> Detailed analytics
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/test-newsletter">
                  Test Sound Integration Features
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Newsletter Templates</h2>
            <p className="text-gray-600 mb-8">
              Email templates for newsletter campaigns will be available here.
            </p>
            
            <div className="p-12 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
              <p className="text-gray-500 text-center">
                Newsletter template editor coming soon.<br />
                <span className="text-sm">Create and manage email templates with embedded TikTok template links.</span>
              </p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
              <CardDescription>Technical information for developers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Application URL</h3>
                  <p className="text-sm bg-muted p-2 rounded">{appUrl || 'Not available'}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">API Endpoints</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li><code>/api/newsletter/weekly-sounds</code> - Weekly trending sounds showcase</li>
                    <li><code>/api/newsletter/link-generator</code> - Generate newsletter links</li>
                    <li><code>/api/newsletter/analytics</code> - Newsletter analytics data</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Current Weekly Showcase</h3>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-60">
                    {weeklyShowcase ? JSON.stringify(weeklyShowcase, null, 2) : 'No showcase data loaded'}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 