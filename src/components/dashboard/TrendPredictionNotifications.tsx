'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  TrendingUp, 
  UserCog, 
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { 
  Badge, 
  Button,
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from '@/components/ui/ui-compatibility';
import { TrendPredictionNotification } from '@/lib/types/trendingTemplate';

/**
 * Component to display trend prediction notifications
 * Shows alerts for newly predicted trends including expert-verified ones
 */
export function TrendPredictionNotifications() {
  const [notifications, setNotifications] = useState<TrendPredictionNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch trend notifications
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        
        // In development, use mock data
        if (process.env.NODE_ENV === 'development') {
          const mockNotifications = getMockNotifications();
          setNotifications(mockNotifications);
          setLoading(false);
          return;
        }
        
        // In production, fetch from API
        const response = await fetch('/api/templates/predictions/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data.notifications);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching trend notifications:', error);
        setError('Failed to load notifications');
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);
  
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    // Update local state first for responsiveness
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true } 
          : notification
      )
    );
    
    // In production, we would update the server
    if (process.env.NODE_ENV !== 'development') {
      try {
        await fetch(`/api/templates/predictions/notifications/${notificationId}/read`, {
          method: 'POST'
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Trend Alerts
          </CardTitle>
          <CardDescription>Loading trend notifications...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Trend Alerts
          </CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Show empty state
  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Trend Alerts
          </CardTitle>
          <CardDescription>No new trend predictions to show</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            New potential trends will appear here when our AI detects early viral patterns.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Render notifications
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bell className="mr-2 h-5 w-5" />
          Trend Alerts
        </CardTitle>
        <CardDescription>
          {notifications.filter(n => !n.isRead).length} new potential trends detected
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map(notification => (
            <div 
              key={notification.id}
              className={`flex items-start p-3 rounded-lg ${notification.isRead ? 'bg-gray-50' : 'bg-blue-50 border-l-4 border-blue-500'}`}
            >
              <div className="flex-shrink-0 mr-3">
                {notification.thumbnailUrl ? (
                  <div className="relative w-12 h-12 rounded overflow-hidden">
                    <Image 
                      src={notification.thumbnailUrl} 
                      alt={notification.templateTitle}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-12 h-12 rounded bg-gray-200">
                    <TrendingUp className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">
                    {notification.templateTitle}
                  </h4>
                  <div className="flex items-center">
                    {notification.expertVerified && (
                      <Badge className="mr-1 bg-purple-100 text-purple-800">
                        <UserCog className="h-3 w-3 mr-1" />
                        Expert Verified
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {Math.round(notification.confidenceScore * 100)}%
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="font-medium">{notification.category}</span> • Predicted {formatDistanceToNow(new Date(notification.predictedAt), { addSuffix: true })}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <Link href={`/trend-predictions?id=${notification.templateId}`}>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Prediction
                    </Button>
                  </Link>
                  {!notification.isRead && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2 text-xs"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Link href="/trend-predictions" className="w-full">
          <Button variant="outline" className="w-full">
            View All Predictions
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Mock data for development
function getMockNotifications(): TrendPredictionNotification[] {
  return [
    {
      id: '1',
      templateId: 'template-1',
      templateTitle: 'Product Showcase Template',
      confidenceScore: 0.87,
      predictedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      isRead: false,
      category: 'Product',
      thumbnailUrl: 'https://placehold.co/100x100/7950f2/ffffff?text=Product',
      expertVerified: true
    },
    {
      id: '2',
      templateId: 'template-2',
      templateTitle: 'Fashion Transition Effect',
      confidenceScore: 0.76,
      predictedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      isRead: true,
      category: 'Fashion',
      thumbnailUrl: 'https://placehold.co/100x100/ff6b6b/ffffff?text=Fashion',
      expertVerified: false
    },
    {
      id: '3',
      templateId: 'template-3',
      templateTitle: 'Storytelling Video Template',
      confidenceScore: 0.92,
      predictedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      isRead: false,
      category: 'Storytelling',
      thumbnailUrl: 'https://placehold.co/100x100/4dabf7/ffffff?text=Story',
      expertVerified: true
    }
  ];
} 