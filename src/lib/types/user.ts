import { User as FirebaseUser } from 'firebase/auth';

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
}

// Helper function to check if a user has expert access
export function isExpertUser(user: FirebaseUser | null): boolean {
  if (!user) return false;
  return (user as CustomUser).isExpert === true;
} 