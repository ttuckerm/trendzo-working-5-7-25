import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { Analytics } from 'firebase/analytics';

/**
 * Firebase app configuration
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Firebase app instances
 */
export interface FirebaseInstances {
  db: Firestore;
  auth: Auth;
  storage: FirebaseStorage;
  analytics?: Analytics;
} 