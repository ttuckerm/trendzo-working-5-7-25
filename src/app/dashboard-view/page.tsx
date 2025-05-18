'use client';

import { useState } from 'react';
import Link from 'next/link';
// Import icons individually to avoid barrel optimization issues
import { FileText } from 'lucide-react';
import { Eye } from 'lucide-react';
import { BarChart2 } from 'lucide-react';
import { Users } from 'lucide-react';
import { PlusSquare } from 'lucide-react';
import { Music } from 'lucide-react';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card-component';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CosmicDashboardCard from '@/components/ui/CosmicDashboardCard';
import { AuroraText } from "@/registry/magicui/aurora-text";

export function AuroraTextDemo() {
  return (
    <h1 className="text-4xl font-bold tracking-tighter md:text-5xl lg:text-7xl">
      Your <AuroraText colors={["#4F46E5", "#06B6D4", "#8B5CF6", "#3B82F6", "#10B981"]}>Dashboard</AuroraText>
    </h1>
  );
}

export default function DashboardViewPage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Stats for the dashboard
  const stats = {
    templates: {
      count: 12,
      change: 8,
      period: 'Last 30 days'
    },
    views: {
      count: '8.6K',
      change: 15,
      period: 'Last 30 days'
    },
    engagement: {
      count: '4.7%',
      change: -2,
      period: 'Last 30 days'
    },
    followers: {
      count: '1.3K',
      change: 5,
      period: 'Last 30 days'
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      {/* Dashboard Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <AuroraTextDemo />
          <p className="text-muted-foreground">
            Overview of your content performance and analytics.
          </p>
        </div>
        <Button className="w-full md:w-auto">
          <PlusSquare className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Stats Card */}
      <div className="grid gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Total Templates</p>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <h2 className="text-3xl font-bold">12</h2>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <span className="text-xs text-green-500 mr-1">+8%</span>
                from Last 30 days
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ minHeight: '400px' }}>
            {/* Sound Performance - Now using CosmicDashboardCard */}
            <div style={{ minHeight: '350px' }}>
              <CosmicDashboardCard
                title="Sound Performance"
                icon={<Music style={{ height: '1.25rem', width: '1.25rem' }} />}
                viewDetailsLink="#"
                subtitle="Sound usage and engagement metrics"
                theme={{
                  primaryColor: "#0FA0CE",
                  secondaryColor: "#0056b3",
                  glowColor: "rgba(15, 160, 206, 0.8)",
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
                  <div>
                    <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>42</p>
                    <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Used Sounds</p>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgb(134, 239, 172)', 
                      backgroundColor: 'rgba(22, 101, 52, 0.3)', 
                      padding: '0 0.5rem', 
                      borderRadius: '0.25rem', 
                      marginTop: '0.25rem', 
                      display: 'inline-block' 
                    }}>+8%</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>19%</p>
                    <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Engagement Boost</p>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgb(134, 239, 172)', 
                      backgroundColor: 'rgba(22, 101, 52, 0.3)', 
                      padding: '0 0.5rem', 
                      borderRadius: '0.25rem', 
                      marginTop: '0.25rem', 
                      display: 'inline-block' 
                    }}>+2.5%</span>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>8.5K</p>
                    <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Sound-Driven Views</p>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: 'rgb(134, 239, 172)', 
                      backgroundColor: 'rgba(22, 101, 52, 0.3)', 
                      padding: '0 0.5rem', 
                      borderRadius: '0.25rem', 
                      marginTop: '0.25rem', 
                      display: 'inline-block' 
                    }}>+8%</span>
                  </div>
                </div>
                
                <h4 style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Top Performing Sounds</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.5rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '0.25rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Summer Vibes</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>124 uses</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>18.2% engagement</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'rgb(134, 239, 172)', marginRight: '0.25rem' }} />
                      <Link href="#" style={{ color: 'rgb(134, 239, 172)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.5rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '0.25rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Deep Bass Loop</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>98 uses</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>15.7% engagement</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'rgb(134, 239, 172)', marginRight: '0.25rem' }} />
                      <Link href="#" style={{ color: 'rgb(134, 239, 172)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.5rem', 
                    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                    borderRadius: '0.25rem' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem' }}>Trending Beat 2023</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>86 uses</span>
                      <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>14.3% engagement</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <TrendingUp style={{ height: '0.75rem', width: '0.75rem', color: 'rgb(134, 239, 172)', marginRight: '0.25rem' }} />
                      <Link href="#" style={{ color: 'rgb(134, 239, 172)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </CosmicDashboardCard>
            </div>
            
            {/* Template-Sound Performance - Now using CosmicDashboardCard */}
            <div style={{ minHeight: '350px' }}>
              <CosmicDashboardCard
                title="Template-Sound Performance"
                icon={
                  <svg style={{ height: '1.25rem', width: '1.25rem' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9H21M3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V9ZM9 9V21M3 15H9M15 9V21M3 17H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                viewDetailsLink="#"
                subtitle="Cross-referencing template and sound metrics"
                theme={{
                  primaryColor: "#9333EA",
                  secondaryColor: "#6B21A8",
                  glowColor: "rgba(147, 51, 234, 0.6)",
                }}
              >
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
                    gap: '0.5rem', 
                    marginBottom: '1rem', 
                    fontSize: '0.875rem', 
                    fontWeight: '500', 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.2)', 
                    paddingBottom: '0.5rem' 
                  }}>
                    <div>Template Type</div>
                    <div>Best Sound</div>
                    <div>Engagement</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
                      gap: '0.5rem', 
                      fontSize: '0.875rem', 
                      paddingTop: '0.5rem', 
                      paddingBottom: '0.5rem', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
                    }}>
                      <div>Product Showcase</div>
                      <div>Summer Vibes</div>
                      <div style={{ color: 'rgb(134, 239, 172)' }}>24.7%</div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
                      gap: '0.5rem', 
                      fontSize: '0.875rem', 
                      paddingTop: '0.5rem', 
                      paddingBottom: '0.5rem', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
                    }}>
                      <div>Tutorial Format</div>
                      <div>Deep Bass Loop</div>
                      <div style={{ color: 'rgb(134, 239, 172)' }}>19.3%</div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', 
                      gap: '0.5rem', 
                      fontSize: '0.875rem', 
                      paddingTop: '0.5rem', 
                      paddingBottom: '0.5rem', 
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)' 
                    }}>
                      <div>Brand Story</div>
                      <div>Emotional Piano</div>
                      <div style={{ color: 'rgb(134, 239, 172)' }}>22.1%</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '1.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  backgroundColor: 'rgba(30, 58, 138, 0.2)', 
                  padding: '0.75rem', 
                  borderRadius: '0.375rem' 
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg style={{ height: '1.25rem', width: '1.25rem', color: 'rgb(147, 197, 253)' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.5 14.5L4 18V4C4 3.44772 4.44772 3 5 3H19C19.5523 3 20 3.44772 20 4V14C20 14.5523 19.5523 15 19 15H8.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: '0.875rem' }}>
                    <p style={{ fontWeight: '500' }}>Template-Sound Recommendation</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Adding sound to your templates increases engagement by ~22% on average. Try adding trending sounds to your most viewed templates.</p>
                  </div>
                </div>
              </CosmicDashboardCard>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="pt-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-bold mb-4">Analytics</h2>
              <p className="text-muted-foreground">
                Track performance metrics for your content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="engagement" className="pt-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-bold mb-4">Engagement</h2>
              <p className="text-muted-foreground">
                Monitor user engagement with your content.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 