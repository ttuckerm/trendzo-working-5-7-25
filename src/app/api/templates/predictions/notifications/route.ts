import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { TrendPredictionNotification } from '@/lib/types/trendingTemplate';
import { checkSubscriptionAccess } from '@/middleware/checkSubscription';
import { isDemoRequest, getSampleTrendPredictions } from '@/lib/utils/demoData';

/**
 * API endpoint to fetch trend prediction notifications
 * 
 * This endpoint requires premium subscription.
 * Non-premium users can access demo data by adding ?demo=true
 */
export async function GET(request: NextRequest) {
  try {
    // Check subscription access with our middleware
    const subscriptionCheck = await checkSubscriptionAccess(request, {
      requiredTier: 'premium',
      allowDemoData: true
    });
    
    // If the subscription check returned a response, return it directly
    if (subscriptionCheck) {
      // If it's a demo request, return sample data
      if (isDemoRequest(request)) {
        // Generate notifications from sample predictions
        const samplePredictions = getSampleTrendPredictions();
        const demoNotifications: TrendPredictionNotification[] = samplePredictions.map(pred => ({
          id: `notif-${pred.id}`,
          templateId: pred.id,
          templateTitle: pred.name,
          confidenceScore: pred.confidence,
          predictedAt: pred.createdAt,
          isRead: Math.random() > 0.5, // Random read status
          category: pred.category,
          thumbnailUrl: `/images/templates/demo-${pred.id}.jpg`
        }));
        
        return NextResponse.json({
          notifications: demoNotifications,
          count: demoNotifications.length,
          isDemo: true
        });
      }
      
      return subscriptionCheck;
    }
    
    // For development mode, return mock notifications
    if (process.env.NODE_ENV === 'development') {
      console.log("🧪 [DEV MODE] Using mock trend prediction notifications");
      
      // Mock notifications for development
      const mockNotifications: TrendPredictionNotification[] = [
        {
          id: 'notif-1',
          templateId: 'template-1',
          templateTitle: 'Clean Product Showcase',
          confidenceScore: 0.85,
          predictedAt: new Date().toISOString(),
          isRead: false,
          category: 'Product',
          thumbnailUrl: '/images/templates/product-1.jpg'
        },
        {
          id: 'notif-2',
          templateId: 'template-2',
          templateTitle: 'Fashion Transition Effect',
          confidenceScore: 0.76,
          predictedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          isRead: true,
          category: 'Fashion',
          thumbnailUrl: '/images/templates/fashion-1.jpg'
        }
      ];
      
      // Return response
      return NextResponse.json({
        notifications: mockNotifications,
        count: mockNotifications.length
      });
    }
    
    // Get current user session
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get notifications for the user
    const userEmail = session.user.email;
    
    // Check if Firebase db is initialized
    if (!db) {
      console.error("Firebase Firestore not initialized");
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    const userSnapshot = await getDocs(
      query(collection(db, 'users'), where('email', '==', userEmail))
    );
    
    if (userSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get notifications for the user
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userSnapshot.docs[0].id),
      where('type', '==', 'trend_prediction'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    // Transform to notification objects
    const notifications: TrendPredictionNotification[] = [];
    
    for (const notifDoc of notificationsSnapshot.docs) {
      const notifData = notifDoc.data();
      
      notifications.push({
        id: notifDoc.id,
        templateId: notifData.templateId,
        templateTitle: notifData.templateTitle,
        confidenceScore: notifData.confidenceScore,
        predictedAt: notifData.predictedAt,
        isRead: notifData.isRead || false,
        category: notifData.category || 'Unknown',
        thumbnailUrl: notifData.thumbnailUrl
      });
    }
    
    // Return response
    return NextResponse.json({
      notifications,
      count: notifications.length
    });
    
  } catch (error) {
    console.error('Error fetching trend prediction notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
} 