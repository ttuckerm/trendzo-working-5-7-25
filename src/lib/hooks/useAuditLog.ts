import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/lib/hooks/useAuth';

interface AuditEvent {
  action: string;
  userId?: string;
  details?: any;
  timestamp?: Date;
}

export function useAuditLog() {
  const { user } = useAuth();

  const logAuditEvent = async (event: AuditEvent) => {
    try {
      const auditData = {
        ...event,
        userId: event.userId || user?.uid || 'unknown',
        timestamp: event.timestamp || serverTimestamp(),
      };

      await addDoc(collection(db, 'auditLogs'), auditData);
      return true;
    } catch (error) {
      console.error('Error logging audit event:', error);
      return false;
    }
  };

  return { logAuditEvent };
} 