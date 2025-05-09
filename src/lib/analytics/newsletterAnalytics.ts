import { db } from '@/lib/firebase/firebase';
import { doc, updateDoc, increment, setDoc, collection, serverTimestamp, Firestore } from 'firebase/firestore';

// Type the database to avoid linter errors
const firestore = db as Firestore | null;

/**
 * Track a newsletter link click
 * @param linkId The ID of the newsletter link
 * @param userData Optional user data if the user is authenticated
 * @param source The source of the click (e.g., 'email', 'social')
 * @param campaign The campaign ID
 */
export async function trackNewsletterClick(
  linkId: string,
  userData?: { uid: string; subscriptionTier?: string } | null,
  source: string = 'email',
  campaign: string = 'weekly'
) {
  try {
    if (!firestore) {
      console.error('Firestore not initialized');
      return false;
    }

    // Update the newsletter link with the click count
    const linkRef = doc(firestore, 'newsletterLinks', linkId);
    await updateDoc(linkRef, {
      clicks: increment(1),
      lastClickedAt: new Date()
    });

    // Create a click event record for detailed analytics
    const clicksCollection = collection(firestore, 'newsletterClicks');
    await setDoc(doc(clicksCollection), {
      linkId,
      timestamp: serverTimestamp(),
      source,
      campaign,
      userId: userData?.uid || null,
      userTier: userData?.subscriptionTier || 'anonymous',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
    });

    console.log(`Tracked click for newsletter link: ${linkId}`);
    return true;
  } catch (error) {
    console.error('Error tracking newsletter click:', error);
    return false;
  }
}

/**
 * Track a newsletter template view (from redirect)
 * @param templateId The ID of the template being viewed
 * @param linkId The ID of the newsletter link that led to this view
 * @param userData Optional user data if the user is authenticated
 */
export async function trackTemplateView(
  templateId: string,
  linkId: string,
  userData?: { uid: string; subscriptionTier?: string } | null
) {
  try {
    if (!firestore) {
      console.error('Firestore not initialized');
      return false;
    }

    // Update template view count
    const templateRef = doc(firestore, 'templates', templateId);
    await updateDoc(templateRef, {
      'analytics.views': increment(1),
      'analytics.newsletterViews': increment(1),
    });

    // Record detailed view event
    const viewsCollection = collection(firestore, 'templateViews');
    await setDoc(doc(viewsCollection), {
      templateId,
      linkId,
      source: 'newsletter',
      timestamp: serverTimestamp(),
      userId: userData?.uid || null,
      userTier: userData?.subscriptionTier || 'anonymous',
    });

    console.log(`Tracked template view for ${templateId} from newsletter link ${linkId}`);
    return true;
  } catch (error) {
    console.error('Error tracking template view:', error);
    return false;
  }
}

/**
 * Track newsletter analytics for the admin dashboard
 * @param templateId The template ID
 * @param action The action performed (view, edit, conversion)
 * @param linkId The newsletter link ID
 */
export async function trackNewsletterAnalytics(
  templateId: string,
  action: 'view' | 'edit' | 'conversion',
  linkId: string
) {
  try {
    if (!firestore) {
      console.error('Firestore not initialized');
      return false;
    }

    // Update template analytics
    const analyticsRef = doc(firestore, 'newsletterAnalytics', templateId);
    
    const updateData: Record<string, any> = {
      lastUpdated: serverTimestamp(),
    };
    
    // Update the appropriate counter based on the action
    if (action === 'view') {
      updateData.views = increment(1);
    } else if (action === 'edit') {
      updateData.edits = increment(1);
    } else if (action === 'conversion') {
      updateData.conversions = increment(1);
    }
    
    // Update or create the document
    await setDoc(analyticsRef, updateData, { merge: true });
    
    console.log(`Tracked ${action} for template ${templateId} from newsletter link ${linkId}`);
    return true;
  } catch (error) {
    console.error('Error tracking newsletter analytics:', error);
    return false;
  }
} 