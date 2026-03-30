'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  Activity, 
  Video, 
  Clock, 
  Ban, 
  CheckCircle, 
  XCircle,
  Settings,
  Mail,
  Calendar,
  Target
} from 'lucide-react';

interface LimitedUser {
  id: string;
  email: string;
  tiktok_username: string | null;
  access_granted_at: string;
  access_expires_at: string | null;
  daily_analysis_limit: number;
  analyses_used_today: number;
  status: string;
  referral_source: string | null;
  features_enabled: {
    video_analysis: boolean;
    template_access: string;
    optimization_suggestions: string;
  };
  created_at: string;
}

interface UserActivity {
  user_id: string;
  action_type: string;
  timestamp: string;
  details: any;
}

interface BulkAccessForm {
  emails: string;
  access_duration_days: number;
  daily_limit: number;
  referral_source: string;
  features: {
    video_analysis: boolean;
    template_access: string;
    optimization_suggestions: string;
  };
}

export default function LimitedUsersPage() {
  const [users, setUsers] = useState<LimitedUser[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [selectedUser, setSelectedUser] = useState<LimitedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBulkAccess, setShowBulkAccess] = useState(false);
  const [bulkForm, setBulkForm] = useState<BulkAccessForm>({
    emails: '',
    access_duration_days: 30,
    daily_limit: 3,
    referral_source: '',
    features: {
      video_analysis: true,
      template_access: 'top5',
      optimization_suggestions: 'basic'
    }
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    analysesToday: 0,
    conversionRate: 0
  });

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersRes = await fetch('/api/admin/limited-users');
      const usersData = await usersRes.json();

      // Fetch activities
      const activitiesRes = await fetch('/api/admin/limited-users/activities');
      const activitiesData = await activitiesRes.json();

      // Fetch stats
      const statsRes = await fetch('/api/admin/limited-users/stats');
      const statsData = await statsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (activitiesData.success) setActivities(activitiesData.activities);
      if (statsData.success) setStats(statsData.stats);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users data:', error);
      setLoading(false);
    }
  };

  const grantBulkAccess = async () => {
    try {
      const emails = bulkForm.emails.split('\n').filter(email => email.trim());
      
      const response = await fetch('/api/admin/limited-users/bulk-grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emails,
          access_duration_days: bulkForm.access_duration_days,
          daily_limit: bulkForm.daily_limit,
          referral_source: bulkForm.referral_source,
          features_enabled: bulkForm.features
        })
      });

      if (response.ok) {
        setShowBulkAccess(false);
        setBulkForm({
          emails: '',
          access_duration_days: 30,
          daily_limit: 3,
          referral_source: '',
          features: {
            video_analysis: true,
            template_access: 'top5',
            optimization_suggestions: 'basic'
          }
        });
        fetchUsersData();
      }
    } catch (error) {
      console.error('Failed to grant bulk access:', error);
    }
  };

  const updateUserStatus = async (userId: string, status: string) => {
    try {
      const response = await fetch('/api/admin/limited-users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status })
      });

      if (response.ok) {
        fetchUsersData();
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const updateUserLimits = async (userId: string, daily_limit: number) => {
    try {
      const response = await fetch('/api/admin/limited-users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, daily_analysis_limit: daily_limit })
      });

      if (response.ok) {
        fetchUsersData();
      }
    } catch (error) {
      console.error('Failed to update user limits:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      case 'expired':
        return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUsageColor = (used: number, limit: number) => {
    const percentage = (used / limit) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
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
          <h1 className="text-3xl font-bold">👥 Limited User Management</h1>
          <p className="text-muted-foreground">
            Manage access control and feature gating for limited users
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={showBulkAccess} onOpenChange={setShowBulkAccess}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Grant Bulk Access
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Grant Bulk Access</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Addresses (one per line)</label>
                  <Textarea
                    placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                    value={bulkForm.emails}
                    onChange={(e) => setBulkForm({...bulkForm, emails: e.target.value})}
                    rows={5}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Access Duration (days)</label>
                    <Input
                      type="number"
                      value={bulkForm.access_duration_days}
                      onChange={(e) => setBulkForm({...bulkForm, access_duration_days: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Daily Analysis Limit</label>
                    <Input
                      type="number"
                      value={bulkForm.daily_limit}
                      onChange={(e) => setBulkForm({...bulkForm, daily_limit: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Referral Source</label>
                  <Input
                    placeholder="e.g., viral_video_123, campaign_abc"
                    value={bulkForm.referral_source}
                    onChange={(e) => setBulkForm({...bulkForm, referral_source: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Feature Access</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={bulkForm.features.video_analysis}
                        onChange={(e) => setBulkForm({
                          ...bulkForm, 
                          features: {...bulkForm.features, video_analysis: e.target.checked}
                        })}
                      />
                      <label className="text-sm">Video Analysis</label>
                    </div>
                    
                    <div>
                      <label className="text-sm">Template Access</label>
                      <Select
                        value={bulkForm.features.template_access}
                        onValueChange={(value) => setBulkForm({
                          ...bulkForm,
                          features: {...bulkForm.features, template_access: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top5">Top 5 Templates</SelectItem>
                          <SelectItem value="top10">Top 10 Templates</SelectItem>
                          <SelectItem value="all">All Templates</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm">Optimization Suggestions</label>
                      <Select
                        value={bulkForm.features.optimization_suggestions}
                        onValueChange={(value) => setBulkForm({
                          ...bulkForm,
                          features: {...bulkForm.features, optimization_suggestions: value}
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic Suggestions</SelectItem>
                          <SelectItem value="advanced">Advanced Suggestions</SelectItem>
                          <SelectItem value="full">Full Optimization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowBulkAccess(false)}>
                    Cancel
                  </Button>
                  <Button onClick={grantBulkAccess}>
                    Grant Access
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button onClick={fetchUsersData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Limited access users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">
              Users active in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Today</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.analysesToday}</div>
            <p className="text-xs text-muted-foreground">
              Video analyses performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.conversionRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Access to success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Limited Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{user.email}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.tiktok_username && `@${user.tiktok_username} • `}
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        {user.referral_source && (
                          <div className="text-xs text-blue-600">
                            Source: {user.referral_source}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${getUsageColor(user.analyses_used_today, user.daily_analysis_limit)}`}>
                          {user.analyses_used_today}/{user.daily_analysis_limit} analyses
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.access_expires_at 
                            ? `Expires ${new Date(user.access_expires_at).toLocaleDateString()}`
                            : 'No expiration'
                          }
                        </div>
                      </div>

                      {getStatusBadge(user.status)}

                      <div className="flex space-x-2">
                        {user.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserStatus(user.id, 'suspended')}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserStatus(user.id, 'active')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.slice(0, 20).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">{activity.action_type.replace('_', ' ').toUpperCase()}</div>
                        <div className="text-sm text-muted-foreground">
                          User ID: {activity.user_id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Video Analysis</span>
                    <span className="font-bold">{activities.filter(a => a.action_type === 'video_analyzed').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Template Views</span>
                    <span className="font-bold">{activities.filter(a => a.action_type === 'template_viewed').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimizations Applied</span>
                    <span className="font-bold">{activities.filter(a => a.action_type === 'optimization_applied').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Users</span>
                    <span className="font-bold text-green-600">
                      {users.filter(u => u.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Suspended Users</span>
                    <span className="font-bold text-red-600">
                      {users.filter(u => u.status === 'suspended').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Expired Access</span>
                    <span className="font-bold text-yellow-600">
                      {users.filter(u => u.status === 'expired').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Settings Modal */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Settings: {selectedUser.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Daily Analysis Limit</label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    defaultValue={selectedUser.daily_analysis_limit}
                    onChange={(e) => {
                      const newLimit = parseInt(e.target.value);
                      if (newLimit > 0) {
                        updateUserLimits(selectedUser.id, newLimit);
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">analyses per day</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Current Usage</label>
                <div className="text-sm">
                  {selectedUser.analyses_used_today} of {selectedUser.daily_analysis_limit} analyses used today
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Access Status</label>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(selectedUser.status)}
                  {selectedUser.access_expires_at && (
                    <span className="text-sm text-muted-foreground">
                      Expires: {new Date(selectedUser.access_expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}