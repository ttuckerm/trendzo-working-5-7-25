import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';

/**
 * API endpoint to mark a trend prediction notification as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For development mode, return a success response
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧪 [DEV MODE] Marking notification ${params.id} as read`);
      return NextResponse.json({
        success: true,
        message: 'Notification marked as read (Development Mode)'
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
    
    // Check if user has platinum tier access
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
    
    const userData = userSnapshot.docs[0].data();
    const userTier = userData.subscriptionTier || 'free';
    
    // Only platinum tier has access
    if (userTier !== 'platinum') {
      return NextResponse.json(
        { error: 'Platinum tier required' },
        { status: 403 }
      );
    }
    
    // Get notification ID from params
    const notificationId = params.id;
    
    // Get notification document reference
    const notificationRef = doc(db, 'notifications', notificationId);
    
    // Get notification data
    const notificationDoc = await getDoc(notificationRef);
    
    if (!notificationDoc.exists()) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }
    
    // Check if notification belongs to this user
    const notificationData = notificationDoc.data();
    
    if (notificationData.userId !== userSnapshot.docs[0].id) {
      return NextResponse.json(
        { error: 'Not authorized to access this notification' },
        { status: 403 }
      );
    }
    
    // Update notification to mark as read
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}