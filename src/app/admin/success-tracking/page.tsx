'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  Star, 
  Users, 
  Video, 
  Heart, 
  Share,
  MessageSquare,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Award,
  Target,
  Zap
} from 'lucide-react';

interface SuccessStory {
  id: string;
  user_id: string;
  user_email?: string;
  before_metrics: {
    avg_views: number;
    avg_likes: number;
    avg_shares: number;
    follower_count: number;
  };
  after_metrics: {
    avg_views: number;
    avg_likes: number;
    avg_shares: number;
    follower_count: number;
  };
  testimonial_text: string;
  video_url?: string;
  improvement_percentage: number;
  verified: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

interface UserMetrics {
  totalStories: number;
  verifiedStories: number;
  featuredStories: number;
  avgImprovement: number;
  conversionRate: number;
}

export default function SuccessTrackingPage() {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    totalStories: 0,
    verifiedStories: 0,
    featuredStories: 0,
    avgImprovement: 0,
    conversionRate: 0
  });
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);
  const [showAddStory, setShowAddStory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newStory, setNewStory] = useState({
    user_email: '',
    testimonial_text: '',
    video_url: '',
    before_views: '',
    before_likes: '',
    before_followers: '',
    after_views: '',
    after_likes: '',
    after_followers: ''
  });

  useEffect(() => {
    fetchSuccessData();
  }, []);

  const fetchSuccessData = async () => {
    try {
      setLoading(true);

      // Fetch success stories
      const storiesRes = await fetch('/api/admin/success-tracking/stories');
      const storiesData = await storiesRes.json();

      // Fetch metrics
      const metricsRes = await fetch('/api/admin/success-tracking/metrics');
      const metricsData = await metricsRes.json();

      if (storiesData.success) setStories(storiesData.stories);
      if (metricsData.success) setMetrics(metricsData.metrics);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch success data:', error);
      setLoading(false);
    }
  };

  const updateStoryStatus = async (storyId: string, updates: { verified?: boolean; featured?: boolean }) => {
    try {
      const response = await fetch('/api/admin/success-tracking/stories/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId, ...updates })
      });

      if (response.ok) {
        fetchSuccessData();
      }
    } catch (error) {
      console.error('Failed to update story:', error);
    }
  };

  const addSuccessStory = async () => {
    try {
      const beforeMetrics = {
        avg_views: parseInt(newStory.before_views) || 0,
        avg_likes: parseInt(newStory.before_likes) || 0,
        avg_shares: 0,
        follower_count: parseInt(newStory.before_followers) || 0
      };

      const afterMetrics = {
        avg_views: parseInt(newStory.after_views) || 0,
        avg_likes: parseInt(newStory.after_likes) || 0,
        avg_shares: 0,
        follower_count: parseInt(newStory.after_followers) || 0
      };

      const improvementPercentage = beforeMetrics.avg_views > 0 
        ? ((afterMetrics.avg_views - beforeMetrics.avg_views) / beforeMetrics.avg_views) * 100
        : 0;

      const response = await fetch('/api/admin/success-tracking/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: newStory.user_email,
          testimonial_text: newStory.testimonial_text,
          video_url: newStory.video_url,
          before_metrics: beforeMetrics,
          after_metrics: afterMetrics,
          improvement_percentage: improvementPercentage
        })
      });

      if (response.ok) {
        setShowAddStory(false);
        setNewStory({
          user_email: '',
          testimonial_text: '',
          video_url: '',
          before_views: '',
          before_likes: '',
          before_followers: '',
          after_views: '',
          after_likes: '',
          after_followers: ''
        });
        fetchSuccessData();
      }
    } catch (error) {
      console.error('Failed to add success story:', error);
    }
  };

  const getImprovementColor = (percentage: number) => {
    if (percentage >= 500) return 'text-purple-600';
    if (percentage >= 200) return 'text-green-600';
    if (percentage >= 100) return 'text-blue-600';
    if (percentage >= 50) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getImprovementBadge = (percentage: number) => {
    if (percentage >= 500) return <Badge className="bg-purple-100 text-purple-800">🚀 Viral Success</Badge>;
    if (percentage >= 200) return <Badge className="bg-green-100 text-green-800">🔥 Amazing</Badge>;
    if (percentage >= 100) return <Badge className="bg-blue-100 text-blue-800">📈 Great</Badge>;
    if (percentage >= 50) return <Badge className="bg-orange-100 text-orange-800">✨ Good</Badge>;
    return <Badge variant="outline">🎯 Moderate</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🏆 Success Tracking & Testimonials</h1>
          <p className="text-muted-foreground">
            Track user success stories and collect testimonials for marketing
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={showAddStory} onOpenChange={setShowAddStory}>
            <DialogTrigger asChild>
              <Button>
                <Star className="h-4 w-4 mr-2" />
                Add Success Story
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Success Story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">User Email</label>
                  <Input
                    placeholder="user@example.com"
                    value={newStory.user_email}
                    onChange={(e) => setNewStory({...newStory, user_email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Testimonial</label>
                  <Textarea
                    placeholder="Share your success story..."
                    value={newStory.testimonial_text}
                    onChange={(e) => setNewStory({...newStory, testimonial_text: e.target.value})}
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Video URL (optional)</label>
                  <Input
                    placeholder="https://tiktok.com/..."
                    value={newStory.video_url}
                    onChange={(e) => setNewStory({...newStory, video_url: e.target.value})}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-medium mb-2">Before Platform</h3>
                    <div className="space-y-2">
                      <Input
                        placeholder="Average views"
                        value={newStory.before_views}
                        onChange={(e) => setNewStory({...newStory, before_views: e.target.value})}
                      />
                      <Input
                        placeholder="Average likes"
                        value={newStory.before_likes}
                        onChange={(e) => setNewStory({...newStory, before_likes: e.target.value})}
                      />
                      <Input
                        placeholder="Follower count"
                        value={newStory.before_followers}
                        onChange={(e) => setNewStory({...newStory, before_followers: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">After Platform</h3>
                    <div className="space-y-2">
                      <Input
                        placeholder="Average views"
                        value={newStory.after_views}
                        onChange={(e) => setNewStory({...newStory, after_views: e.target.value})}
                      />
                      <Input
                        placeholder="Average likes"
                        value={newStory.after_likes}
                        onChange={(e) => setNewStory({...newStory, after_likes: e.target.value})}
                      />
                      <Input
                        placeholder="Follower count"
                        value={newStory.after_followers}
                        onChange={(e) => setNewStory({...newStory, after_followers: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAddStory(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addSuccessStory}>
                    Add Story
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={fetchSuccessData} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStories}</div>
            <p className="text-xs text-muted-foreground">
              Success testimonials
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Stories</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.verifiedStories}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalStories > 0 ? ((metrics.verifiedStories / metrics.totalStories) * 100).toFixed(0) : 0}% verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Stories</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.featuredStories}</div>
            <p className="text-xs text-muted-foreground">
              Ready for marketing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Improvement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getImprovementColor(metrics.avgImprovement)}`}>
              {metrics.avgImprovement.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              View increase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="stories" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stories">Success Stories</TabsTrigger>
          <TabsTrigger value="featured">Featured Testimonials</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        {/* Stories Tab */}
        <TabsContent value="stories" className="space-y-4">
          <div className="grid gap-4">
            {stories.map((story) => (
              <Card key={story.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="font-medium">{story.user_email || 'Anonymous User'}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(story.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {story.verified && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {story.featured && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {getImprovementBadge(story.improvement_percentage)}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Before Platform</h4>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Video className="h-3 w-3 mr-1" />
                              {story.before_metrics.avg_views.toLocaleString()} views
                            </div>
                            <div className="flex items-center">
                              <Heart className="h-3 w-3 mr-1" />
                              {story.before_metrics.avg_likes.toLocaleString()} likes
                            </div>
                            <div className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {story.before_metrics.follower_count.toLocaleString()} followers
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">After Platform</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center text-green-600">
                              <Video className="h-3 w-3 mr-1" />
                              {story.after_metrics.avg_views.toLocaleString()} views
                            </div>
                            <div className="flex items-center text-green-600">
                              <Heart className="h-3 w-3 mr-1" />
                              {story.after_metrics.avg_likes.toLocaleString()} likes
                            </div>
                            <div className="flex items-center text-green-600">
                              <Users className="h-3 w-3 mr-1" />
                              {story.after_metrics.follower_count.toLocaleString()} followers
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Improvement</h4>
                          <div className={`text-2xl font-bold ${getImprovementColor(story.improvement_percentage)}`}>
                            +{story.improvement_percentage.toFixed(0)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Views increased
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Testimonial</h4>
                        <p className="text-sm text-muted-foreground italic">
                          "{story.testimonial_text}"
                        </p>
                      </div>

                      {story.video_url && (
                        <div>
                          <a 
                            href={story.video_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline flex items-center"
                          >
                            <Video className="h-3 w-3 mr-1" />
                            View Success Video
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        size="sm"
                        variant={story.verified ? "default" : "outline"}
                        onClick={() => updateStoryStatus(story.id, { verified: !story.verified })}
                      >
                        {story.verified ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={story.featured ? "default" : "outline"}
                        onClick={() => updateStoryStatus(story.id, { featured: !story.featured })}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Featured Tab */}
        <TabsContent value="featured" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {stories.filter(s => s.featured).map((story) => (
              <Card key={story.id} className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                      <div className={`text-lg font-bold ${getImprovementColor(story.improvement_percentage)}`}>
                        +{story.improvement_percentage.toFixed(0)}%
                      </div>
                    </div>

                    <blockquote className="text-sm italic">
                      "{story.testimonial_text}"
                    </blockquote>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{story.user_email || 'Anonymous'}</span>
                      <span>{new Date(story.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span>
                        {story.before_metrics.avg_views.toLocaleString()} → {story.after_metrics.avg_views.toLocaleString()} views
                      </span>
                      {story.video_url && (
                        <a href={story.video_url} target="_blank" className="text-blue-600 hover:underline">
                          View Video
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Improvement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { range: '500%+', count: stories.filter(s => s.improvement_percentage >= 500).length, color: 'bg-purple-500' },
                    { range: '200-499%', count: stories.filter(s => s.improvement_percentage >= 200 && s.improvement_percentage < 500).length, color: 'bg-green-500' },
                    { range: '100-199%', count: stories.filter(s => s.improvement_percentage >= 100 && s.improvement_percentage < 200).length, color: 'bg-blue-500' },
                    { range: '50-99%', count: stories.filter(s => s.improvement_percentage >= 50 && s.improvement_percentage < 100).length, color: 'bg-orange-500' },
                    { range: '0-49%', count: stories.filter(s => s.improvement_percentage < 50).length, color: 'bg-gray-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded ${item.color}`}></div>
                        <span className="text-sm">{item.range}</span>
                      </div>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Story Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Stories</span>
                    <span className="font-bold">{stories.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Verified</span>
                    <span className="font-bold text-green-600">{stories.filter(s => s.verified).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Featured</span>
                    <span className="font-bold text-yellow-600">{stories.filter(s => s.featured).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">With Video</span>
                    <span className="font-bold text-blue-600">{stories.filter(s => s.video_url).length}</span>
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