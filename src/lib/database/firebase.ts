import { db, auth, storage } from '../firebase/firebase';
import { DatabaseClient, QueryBuilder, QueryResult } from './types';
import { collection, query, where, orderBy, limit as firestoreLimit, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Firebase wrapper to match our common interface
class FirebaseQueryBuilder implements QueryBuilder {
  private collectionRef: any;
  private queryConstraints: any[] = [];
  private docId?: string;

  constructor(table: string) {
    this.collectionRef = collection(db, table);
  }

  async select(columns = '*'): Promise<QueryResult> {
    try {
      const q = query(this.collectionRef, ...this.queryConstraints);
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async insert(data: any): Promise<QueryResult> {
    try {
      const docRef = await addDoc(this.collectionRef, data);
      return { data: { id: docRef.id, ...data }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async update(data: any): Promise<QueryResult> {
    try {
      if (!this.docId) throw new Error('Document ID required for update');
      const docRef = doc(this.collectionRef, this.docId);
      await updateDoc(docRef, data);
      return { data: { id: this.docId, ...data }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async delete(): Promise<QueryResult> {
    try {
      if (!this.docId) throw new Error('Document ID required for delete');
      const docRef = doc(this.collectionRef, this.docId);
      await deleteDoc(docRef);
      return { data: { id: this.docId }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  eq(column: string, value: any): QueryBuilder {
    if (column === 'id') {
      this.docId = value;
    } else {
      this.queryConstraints.push(where(column, '==', value));
    }
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    this.queryConstraints.push(orderBy(column, options?.ascending ? 'asc' : 'desc'));
    return this;
  }

  limit(count: number): QueryBuilder {
    this.queryConstraints.push(firestoreLimit(count));
    return this;
  }
}

export function createFirebaseClient(): DatabaseClient {
  return {
    from: (table: string) => new FirebaseQueryBuilder(table),
    auth: {
      signUp: async (email: string, password: string) => {
        try {
          const { user } = await createUserWithEmailAndPassword(auth, email, password);
          return { data: user, error: null };
        } catch (error) {
          return { data: null, error: error as Error };
        }
      },
      signIn: async (email: string, password: string) => {
        try {
          const { user } = await signInWithEmailAndPassword(auth, email, password);
          return { data: user, error: null };
        } catch (error) {
          return { data: null, error: error as Error };
        }
      },
      signOut: async () => {
        try {
          await firebaseSignOut(auth);
          return { error: null };
        } catch (error) {
          return { error: error as Error };
        }
      },
      getUser: async () => {
        return { user: auth.currentUser, error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user);
        });
        return { unsubscribe };
      }
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, file: File) => {
          try {
            const storageRef = ref(storage, `${bucket}/${path}`);
            const snapshot = await uploadBytes(storageRef, file);
            return { data: snapshot, error: null };
          } catch (error) {
            return { data: null, error: error as Error };
          }
        },
        download: async (path: string) => {
          try {
            const storageRef = ref(storage, `${bucket}/${path}`);
            const url = await getDownloadURL(storageRef);
            return { data: url, error: null };
          } catch (error) {
            return { data: null, error: error as Error };
          }
        },
        remove: async (paths: string[]) => {
          try {
            await Promise.all(paths.map(path => {
              const storageRef = ref(storage, `${bucket}/${path}`);
              return deleteObject(storageRef);
            }));
            return { data: true, error: null };
          } catch (error) {
            return { data: null, error: error as Error };
          }
        },
        getPublicUrl: (path: string) => {
          const storageRef = ref(storage, `${bucket}/${path}`);
          // This is a simplified version - Firebase requires getDownloadURL for secure URLs
          return { data: { publicUrl: storageRef.toString() } };
        }
      })
    }
  };
}