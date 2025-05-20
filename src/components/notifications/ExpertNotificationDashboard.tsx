'use client';

import { useState, useEffect } from 'react';
import { Bell, Filter, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
// import { db } from '@/lib/firebase/firebase';
// import { collection, query, where, getDocs, orderBy, Firestore, limit } from 'firebase/firestore';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const COMPONENT_DISABLED_MSG = "ExpertNotificationDashboard: Firebase backend is removed. Notifications will be empty.";

interface ExpertNotification {
  id: string;
  type: 'trend_prediction' | 'market_update' | 'system_alert';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  assignedTo?: string;
}

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'dismissed';
type TypeFilter = 'all' | 'trend_prediction' | 'market_update' | 'system_alert';

export function ExpertNotificationDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<ExpertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const fetchNotifications = async () => {
    // if (!user?.email || !db) return; // db will be null
    if (!user?.email) {
      setLoading(false);
      return;
    }
    console.warn(COMPONENT_DISABLED_MSG);
    setLoading(true);

    // try {
      // setLoading(true);
      
      // let notificationsQuery = query(
      //   collection(db as Firestore, 'expertNotifications'),
      //   where('assignedTo', '==', user.email),
      //   orderBy('createdAt', 'desc'),
      //   limit(50)
      // );

      // if (filter !== 'all') {
      //   notificationsQuery = query(
      //     notificationsQuery,
      //     where('status', '==', filter)
      //   );
      // }

      // if (typeFilter !== 'all') {
      //   notificationsQuery = query(
      //     notificationsQuery,
      //     where('type', '==', typeFilter)
      //   );
      // }

      // const snapshot = await getDocs(notificationsQuery);
      // const notificationData = snapshot.docs.map(doc => ({
      //   id: doc.id,
      //   ...doc.data()
      // })) as ExpertNotification[];

      // setNotifications(notificationData);
      setNotifications([]); // Return empty array
      setLoading(false);
    // } catch (error) {
    //   console.error('Error fetching expert notifications:', error);
    //   toast({
    //     title: 'Error',
    //     description: 'Failed to fetch notifications. Please try again.',
    //     variant: 'destructive'
    //   });
    //   setLoading(false);
    // }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.email, filter, typeFilter]);

  const getSeverityBadge = (severity: ExpertNotification['severity']) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[severity];
  };

  const getStatusIcon = (status: ExpertNotification['status']) => {
    switch (status) {
      case 'reviewed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'dismissed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading notifications...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Expert Notifications
            </CardTitle>
            <CardDescription>
              Manage and review notifications assigned to you
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={typeFilter}
            onValueChange={(value) => setTypeFilter(value as TypeFilter)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="trend_prediction">Trend Predictions</SelectItem>
              <SelectItem value="market_update">Market Updates</SelectItem>
              <SelectItem value="system_alert">System Alerts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No notifications found matching your filters
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 rounded-lg border p-4 hover:bg-gray-50"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(notification.status)}
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">
                      {notification.title}
                    </h4>
                    <Badge className={getSeverityBadge(notification.severity)}>
                      {notification.severity}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {notification.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          // Handle review action
                          toast({
                            title: 'Notification reviewed',
                            description: 'The notification has been marked as reviewed.',
                          });
                        }}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                          // Handle dismiss action
                          toast({
                            title: 'Notification dismissed',
                            description: 'The notification has been dismissed.',
                          });
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 