// import type { User as FirebaseUser } from 'firebase/auth';

// Placeholder for the FirebaseUser type, as the direct import is being removed.
// Add specific fields here (e.g., uid: string, email: string | null) if they are explicitly used from FirebaseUser elsewhere.
export interface FirebaseUser {
  // Example: uid: string;
  // Example: email: string | null;
  // Example: displayName: string | null;
  // Example: photoURL: string | null;
  // For now, keeping it minimal as CustomUser primarily adds fields rather than consuming many from FirebaseUser.
  [key: string]: any; // Allow other properties to exist, to mimic extending an external type
}

export interface CustomUser extends FirebaseUser {
  isExpert?: boolean;
  subscriptionTier?: string;
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      trendAlerts?: boolean;
      expertVerifications?: boolean;
      marketUpdates?: boolean;
      systemAnnouncements?: boolean;
    };
  };
  role?: string;
}

// Helper function to check if a user has expert access
export function isExpertUser(user: FirebaseUser | null): boolean {
  if (!user) return false;
  return (user as CustomUser).isExpert === true;
} 