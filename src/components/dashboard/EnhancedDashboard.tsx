"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Layers, 
  ChevronRight, 
  Plus, 
  Users, 
  BarChart3,
  FileText, 
  Zap, 
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ExternalLink,
  Download,
  AlertCircle,
  Music
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/enhanced-card';
import { Button } from '@/components/ui/enhanced-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import SoundAnalyticsDashboard from '@/components/dashboard/SoundAnalyticsDashboard';
import useScrollToHash from '@/lib/hooks/useScrollToHash';

interface DashboardMetric {
  name: string;
  value: number;
  unit?: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

interface Activity {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  action: string;
  target: string;
  time: string;
  type: 'template' | 'analytics' | 'share' | 'team';
}

interface RecentTemplate {
  id: string;
  title: string;
  thumbnail?: string;
  views: number;
  engagement: number;
  createdAt: string;
}

interface DashboardData {
  metrics: {
    primary: DashboardMetric[];
    secondary: DashboardMetric[];
  };
  recentTemplates: RecentTemplate[];
  activities: Activity[];
}

interface EnhancedDashboardProps {
  data?: DashboardData;
  isLoading?: boolean;
  onCreateTemplate?: () => void;
  onViewAllTemplates?: () => void;
  onViewAllActivity?: () => void;
  className?: string;
}

export function EnhancedDashboard({
  data,
  isLoading = false,
  onCreateTemplate,
  onViewAllTemplates,
  onViewAllActivity,
  className = "",
}: EnhancedDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  
  // Toggle expanded section
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };
  
  // Toggle expanded chart
  const toggleChart = (chart: string) => {
    setExpandedChart(expandedChart === chart ? null : chart);
  };
  
  // Format values with proper units
  const formatValue = (value: number, unit?: string): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit || ''}`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit || ''}`;
    }
    return `${value}${unit || ''}`;
  };
  
  // Format percentage changes
  const formatChange = (change: number): string => {
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };
  
  // Get color class based on trend
  const getTrendColorClass = (trend: 'up' | 'down' | 'neutral'): string => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-neutral-500';
  };
  
  // Get icon based on activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'template':
        return <FileText size={16} className="text-blue-500" />;
      case 'analytics':
        return <BarChart3 size={16} className="text-purple-500" />;
      case 'share':
        return <Users size={16} className="text-green-500" />;
      case 'team':
        return <Users size={16} className="text-orange-500" />;
      default:
        return <Zap size={16} className="text-neutral-500" />;
    }
  };
  
  // Loading skeletons
  const MetricSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-5 bg-neutral-200 rounded-md w-24 mb-2"></div>
      <div className="h-8 bg-neutral-200 rounded-md w-32 mb-1"></div>
      <div className="h-4 bg-neutral-200 rounded-md w-16"></div>
    </div>
  );
  
  const TemplateCardSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-32 bg-neutral-200 rounded-lg mb-3"></div>
      <div className="h-5 bg-neutral-200 rounded-md w-3/4 mb-2"></div>
      <div className="flex justify-between">
        <div className="h-4 bg-neutral-200 rounded-md w-16"></div>
        <div className="h-4 bg-neutral-200 rounded-md w-16"></div>
      </div>
    </div>
  );
  
  const ActivitySkeleton = () => (
    <div className="animate-pulse flex items-start space-x-3 py-3">
      <div className="h-8 w-8 bg-neutral-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-neutral-200 rounded-md w-3/4 mb-2"></div>
        <div className="h-3 bg-neutral-200 rounded-md w-1/2"></div>
      </div>
    </div>
  );
  
  // Empty state component
  const EmptyState = ({ type, onAction }: { type: string, onAction?: () => void }) => (
    <div className="text-center py-10">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 mb-4">
        {type === 'templates' ? <Layers className="text-neutral-400" /> : <Zap className="text-neutral-400" />}
      </div>
      <h3 className="text-lg font-medium text-neutral-700 mb-2">
        No {type} yet
      </h3>
      <p className="text-neutral-500 mb-4">
        {type === 'templates' 
          ? "Create your first template to get started" 
          : "Activity will appear here as you work"
        }
      </p>
      {onAction && type === 'templates' && (
        <Button onClick={onAction} className="flex items-center">
          <Plus size={16} className="mr-1" /> Create Template
        </Button>
      )}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-800">Dashboard</h1>
          <p className="text-neutral-500 mt-1">Overview of your content performance</p>
        </div>
        <Button onClick={onCreateTemplate} className="flex items-center">
          <Plus size={16} className="mr-1" /> Create Template
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="sounds">Sound Library</TabsTrigger>
          {/* Premium tier feature */}
          <TabsTrigger value="audio-visual" className="relative">
            Audio-Visual
            <span className="absolute -top-1 -right-1 bg-gradient-to-r from-orange-400 to-amber-600 text-white text-[10px] px-1 rounded-sm">
              PRO
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Primary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <MetricSkeleton />
                  </CardContent>
                </Card>
              ))
            ) : !data?.metrics.primary.length ? (
              <Card className="col-span-full">
                <CardContent>
                  <EmptyState type="metrics" />
                </CardContent>
              </Card>
            ) : (
              data.metrics.primary.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="text-sm font-medium text-neutral-500 mb-1">{metric.name}</div>
                      <div className="flex items-end justify-between">
                        <div className="text-2xl font-semibold text-neutral-900">
                          {formatValue(metric.value, metric.unit)}
                        </div>
                        <div className={`text-sm font-medium flex items-center ${getTrendColorClass(metric.trend)}`}>
                          {metric.trend === 'up' ? (
                            <TrendingUp size={14} className="mr-1" />
                          ) : metric.trend === 'down' ? (
                            <TrendingDown size={14} className="mr-1" />
                          ) : null}
                          {formatChange(metric.change)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
          
          {/* Secondary metrics + Recent templates grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Secondary metrics */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">Performance Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="py-3 border-b last:border-0 border-neutral-100">
                        <MetricSkeleton />
                      </div>
                    ))
                  ) : !data?.metrics.secondary.length ? (
                    <EmptyState type="metrics" />
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {data.metrics.secondary.map((metric, index) => (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                          className="py-3 first:pt-0"
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium text-neutral-600">{metric.name}</div>
                            <div className={`text-sm font-medium ${getTrendColorClass(metric.trend)}`}>
                              {formatChange(metric.change)}
                            </div>
                          </div>
                          <div className="text-base font-semibold mt-1">
                            {formatValue(metric.value, metric.unit)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="link" className="pl-0">
                    View all metrics <ChevronRight size={14} className="ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            {/* Recent templates */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg">Recent Templates</CardTitle>
                    <CardDescription>Recently created or edited templates</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={onViewAllTemplates}>
                    View all
                  </Button>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array(4).fill(0).map((_, i) => (
                        <div key={i}>
                          <TemplateCardSkeleton />
                        </div>
                      ))}
                    </div>
                  ) : !data?.recentTemplates.length ? (
                    <EmptyState type="templates" onAction={onCreateTemplate} />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.recentTemplates.slice(0, 4).map((template, index) => (
                        <motion.div
                          key={template.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                        >
                          <div className="group cursor-pointer">
                            <div 
                              className="h-32 rounded-lg bg-neutral-100 mb-2 overflow-hidden"
                              style={{ 
                                backgroundImage: template.thumbnail ? `url(${template.thumbnail})` : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              {!template.thumbnail && (
                                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                                  <Layers className="text-neutral-300" size={32} />
                                </div>
                              )}
                            </div>
                            <h3 className="font-medium text-neutral-800 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                              {template.title}
                            </h3>
                            <div className="flex justify-between text-xs text-neutral-500">
                              <span>{formatValue(template.views)} views</span>
                              <span>{template.engagement}% engagement</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Recent activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest actions from you and your team</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={onViewAllActivity}>
                View all
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="divide-y divide-neutral-100">
                  {Array(5).fill(0).map((_, i) => (
                    <ActivitySkeleton key={i} />
                  ))}
                </div>
              ) : !data?.activities.length ? (
                <EmptyState type="activity" />
              ) : (
                <div className="divide-y divide-neutral-100">
                  {data.activities.slice(0, 5).map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.2 }}
                      className="flex items-start space-x-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-neutral-100 rounded-full overflow-hidden flex items-center justify-center text-xs font-medium">
                        {activity.user.avatar ? (
                          <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{activity.user.initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-neutral-800 truncate">{activity.user.name}</span>
                          <span className="mx-1 text-neutral-500">{activity.action}</span>
                          <span className="font-medium text-neutral-800 truncate">{activity.target}</span>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-neutral-500">
                          <span>{activity.time}</span>
                          <span className="flex items-center ml-2">
                            {getActivityIcon(activity.type)}
                            <span className="ml-1 capitalize">{activity.type}</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Templates</CardTitle>
              <CardDescription>Browse and manage all your content templates</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <TemplateCardSkeleton key={i} />
                  ))}
                </div>
              ) : !data?.recentTemplates.length ? (
                <EmptyState type="templates" onAction={onCreateTemplate} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {data.recentTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="group cursor-pointer border border-neutral-200 rounded-lg p-3 hover:border-blue-200 hover:shadow-sm transition-all">
                        <div 
                          className="h-40 rounded-lg bg-neutral-100 mb-3 overflow-hidden"
                          style={{ 
                            backgroundImage: template.thumbnail ? `url(${template.thumbnail})` : undefined,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                        >
                          {!template.thumbnail && (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                              <Layers className="text-neutral-300" size={32} />
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-neutral-800 group-hover:text-blue-600 transition-colors mb-1">
                          {template.title}
                        </h3>
                        <div className="flex justify-between text-xs text-neutral-500">
                          <span>{formatValue(template.views)} views</span>
                          <span>{template.engagement}% engagement</span>
                          <span>{template.createdAt}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={onCreateTemplate} className="flex items-center">
                <Plus size={16} className="mr-1" /> Create Template
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="activities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Activity</CardTitle>
              <CardDescription>Recent actions and notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="divide-y divide-neutral-100">
                  {Array(10).fill(0).map((_, i) => (
                    <ActivitySkeleton key={i} />
                  ))}
                </div>
              ) : !data?.activities.length ? (
                <EmptyState type="activity" />
              ) : (
                <div className="divide-y divide-neutral-100">
                  {data.activities.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start space-x-3 py-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-full overflow-hidden flex items-center justify-center text-sm font-medium">
                        {activity.user.avatar ? (
                          <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{activity.user.initials}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline">
                          <span className="font-medium text-neutral-800 mr-1">{activity.user.name}</span>
                          <span className="text-neutral-500">{activity.action}</span>
                          <span className="font-medium text-neutral-800 ml-1">{activity.target}</span>
                          <span className="ml-auto text-xs text-neutral-500">{activity.time}</span>
                        </div>
                        <div className="flex items-center mt-1 text-xs text-neutral-500">
                          {getActivityIcon(activity.type)}
                          <span className="ml-1 capitalize">{activity.type}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Sound Library Tab */}
        <TabsContent value="sounds" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Sound Library</CardTitle>
                <CardDescription>
                  Browse and manage trending sounds for your templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[600px]">
                  <SoundAnalyticsDashboard />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Audio-Visual Tab (Premium Feature) */}
        <TabsContent value="audio-visual" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Audio-Visual Experience</CardTitle>
                  <CardDescription>
                    Enhance your templates with synchronized audio-visual experiences
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-gradient-to-r from-orange-400 to-amber-600 text-white">
                    Premium Feature
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-4 border border-dashed rounded-lg flex items-center justify-center flex-col gap-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">Audio-Visual Integration</h3>
                    <p className="text-sm text-neutral-500 mt-1">
                      Create harmonious audio-visual experiences that boost engagement.
                    </p>
                  </div>
                  <Button className="mt-2">
                    Explore Audio-Visual Features
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 