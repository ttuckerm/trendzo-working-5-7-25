// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
// import { collection, addDoc, doc, setDoc, Firestore, Timestamp } from 'firebase/firestore'; // Firebase SDK

const TEST_DATA_DISABLED_MSG = "test-data.ts: Firebase interaction is disabled. Test data generation will not occur. TODO: Reimplement with Supabase if needed.";

export async function makeUserExpert(userEmail: string) {
  // if (!db) return;
  console.warn(`${TEST_DATA_DISABLED_MSG} Attempted to make user expert: ${userEmail}`);

  // try {
  //   const userDocRef = doc(db as Firestore, 'users', userEmail);
  //   await setDoc(userDocRef, {
  //     isExpert: true,
  //     updatedAt: Timestamp.now()
  //   }, { merge: true });
    
  //   console.log('User made expert successfully');
  // } catch (error) {
  //   console.error('Error making user expert:', error);
  //   throw error;
  // }
  return Promise.resolve();
}

export async function addTestNotifications(userEmail: string) {
  // if (!db) return;
  console.warn(`${TEST_DATA_DISABLED_MSG} Attempted to add test notifications for user: ${userEmail}`);

  // const notifications = [
  //   {
  //     userId: userEmail,
  //     type: 'trend_prediction',
  //     title: 'New Trending Template Detected',
  //     description: 'Our AI has detected a potential trending template in the Fashion category',
  //     isRead: false,
  //     createdAt: Timestamp.now(), // Firebase Timestamp
  //   },
  //   {
  //     userId: userEmail,
  //     type: 'market_update',
  //     title: 'Weekly Market Analysis',
  //     description: 'Your weekly market trend analysis report is now available',
  //     isRead: true,
  //     createdAt: Timestamp.now(), // Firebase Timestamp
  //   }
  // ];

  // const expertNotifications = [
  //   {
  //     assignedTo: userEmail,
  //     type: 'trend_prediction',
  //     title: 'Review Required: New Trend Pattern',
  //     description: 'A new trend pattern needs expert verification in the Tech category',
  //     severity: 'high',
  //     status: 'pending',
  //     createdAt: Timestamp.now(), // Firebase Timestamp
  //   },
  //   {
  //     assignedTo: userEmail,
  //     type: 'market_update',
  //     title: 'Market Trend Analysis',
  //     description: 'Please review the latest market trend analysis report',
  //     severity: 'medium',
  //     status: 'pending',
  //     createdAt: Timestamp.now(), // Firebase Timestamp
  //   },
  //   {
  //     assignedTo: userEmail,
  //     type: 'system_alert',
  //     title: 'System Performance Alert',
  //     description: 'Review system performance metrics for the trend detection module',
  //     severity: 'low',
  //     status: 'reviewed',
  //     createdAt: Timestamp.now(), // Firebase Timestamp
  //   }
  // ];

  // try {
  //   // Add regular notifications
  //   for (const notification of notifications) {
  //     await addDoc(collection(db as Firestore, 'notifications'), notification);
  //   }

  //   // Add expert notifications
  //   for (const notification of expertNotifications) {
  //     await addDoc(collection(db as Firestore, 'expertNotifications'), notification);
  //   }

  //   console.log('Test notifications added successfully');
  // } catch (error) {
  //   console.error('Error adding test notifications:', error);
  // }
  return Promise.resolve();
} 