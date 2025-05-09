import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.templateId || !data.action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Add timestamp and normalize data
    const eventData = {
      templateId: data.templateId,
      source: data.source || 'direct',
      campaign: data.campaign || null,
      action: data.action,
      userId: data.userId || 'anonymous',
      timestamp: serverTimestamp(),
      metadata: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        referrer: request.headers.get('referer') || 'direct',
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
      }
    };
    
    // Log to Firestore analytics collection
    if (db) {
      try {
        const docRef = await addDoc(collection(db, 'template_analytics'), eventData);
        console.log('Analytics event logged with ID:', docRef.id);
      } catch (firestoreError) {
        console.error('Error adding analytics to Firestore:', firestoreError);
        // Continue execution even if Firestore fails
      }
    }
    
    // Always return success even if Firestore logging fails
    // This ensures the user experience isn't affected by analytics issues
    return NextResponse.json({ success: true, message: 'Usage tracked' });
    
  } catch (error) {
    console.error('Error tracking template usage:', error);
    return NextResponse.json(
      { error: 'Failed to track template usage' },
      { status: 500 }
    );
  }
} 