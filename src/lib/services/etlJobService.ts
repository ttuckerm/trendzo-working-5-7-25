import { db } from '@/lib/firebase/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Collection name for ETL jobs
const COLLECTION_NAME = 'etlJobs';

// Interface for ETL job data
export interface ETLJobData {
  id?: string;
  name: string;
  type: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  duration?: number;
  error?: string;
  parameters?: Record<string, any>;
  result?: {
    processed: number;
    failed?: number;
    templates?: number;
    message?: string;
  };
}

/**
 * Service for managing ETL job logs in Firebase
 */
export const etlJobService = {
  /**
   * Create a new ETL job log in Firebase
   * @param jobData The job data
   * @returns The created job with ID
   */
  async createJob(jobData: Omit<ETLJobData, 'id'>): Promise<ETLJobData> {
    try {
      // Generate a unique ID for the job
      const jobId = uuidv4();
      
      // Create the job object
      const job: ETLJobData = {
        id: jobId,
        ...jobData,
        // Ensure startTime is set
        startTime: jobData.startTime || new Date().toISOString()
      };
      
      // Save to Firestore
      await setDoc(doc(db, COLLECTION_NAME, jobId), job);
      
      return job;
    } catch (error) {
      console.error('Error creating ETL job log:', error);
      throw error;
    }
  },
  
  /**
   * Update an ETL job log in Firebase
   * @param jobId The job ID
   * @param jobData The job data to update
   */
  async updateJob(jobId: string, jobData: Partial<ETLJobData>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, jobId);
      
      // Calculate duration if endTime is provided
      if (jobData.endTime && !jobData.duration) {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const existingJob = docSnap.data() as ETLJobData;
          const startTime = new Date(existingJob.startTime).getTime();
          const endTime = new Date(jobData.endTime).getTime();
          jobData.duration = endTime - startTime;
        }
      }
      
      await updateDoc(docRef, jobData as any);
    } catch (error) {
      console.error(`Error updating ETL job log ${jobId}:`, error);
      throw error;
    }
  },
  
  /**
   * Mark a job as completed
   * @param jobId The job ID
   * @param result The job result
   */
  async completeJob(
    jobId: string, 
    result: ETLJobData['result']
  ): Promise<void> {
    try {
      const endTime = new Date().toISOString();
      await this.updateJob(jobId, {
        status: 'completed',
        endTime,
        result
      });
    } catch (error) {
      console.error(`Error completing ETL job ${jobId}:`, error);
      throw error;
    }
  },
  
  /**
   * Mark a job as failed
   * @param jobId The job ID
   * @param error The error message
   * @param partialResult Optional partial result data
   */
  async failJob(
    jobId: string, 
    error: string,
    partialResult?: Partial<ETLJobData['result']>
  ): Promise<void> {
    try {
      const endTime = new Date().toISOString();
      
      // Prepare the update object
      const updateData: Partial<ETLJobData> = {
        status: 'failed',
        endTime,
        error
      };
      
      // Only add result if partialResult is provided
      if (partialResult) {
        // Make sure processed is defined if included in partialResult
        if (partialResult.processed !== undefined) {
          updateData.result = {
            processed: partialResult.processed,
            failed: partialResult.failed,
            templates: partialResult.templates,
            message: partialResult.message
          };
        }
      }
      
      await this.updateJob(jobId, updateData);
    } catch (err) {
      console.error(`Error marking ETL job ${jobId} as failed:`, err);
      throw err;
    }
  },
  
  /**
   * Get recent ETL jobs
   * @param limitCount Maximum number of jobs to retrieve
   * @returns Array of ETL jobs
   */
  async getRecentJobs(limitCount = 20): Promise<ETLJobData[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as ETLJobData,
        id: doc.id
      }));
    } catch (error) {
      console.error('Error fetching recent ETL jobs:', error);
      throw error;
    }
  },
  
  /**
   * Get jobs by status
   * @param status The status to filter by
   * @param limitCount Maximum number of jobs to retrieve
   * @returns Array of ETL jobs with the specified status
   */
  async getJobsByStatus(
    status: ETLJobData['status'], 
    limitCount = 20
  ): Promise<ETLJobData[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('status', '==', status),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as ETLJobData,
        id: doc.id
      }));
    } catch (error) {
      console.error(`Error fetching ETL jobs with status ${status}:`, error);
      throw error;
    }
  },
  
  /**
   * Get jobs by type
   * @param type The job type to filter by
   * @param limitCount Maximum number of jobs to retrieve
   * @returns Array of ETL jobs with the specified type
   */
  async getJobsByType(
    type: string, 
    limitCount = 20
  ): Promise<ETLJobData[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('type', '==', type),
        orderBy('startTime', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as ETLJobData,
        id: doc.id
      }));
    } catch (error) {
      console.error(`Error fetching ETL jobs with type ${type}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a single ETL job by ID
   * @param jobId The job ID
   * @returns The job or null if not found
   */
  async getJobById(jobId: string): Promise<ETLJobData | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, jobId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      return {
        ...docSnap.data() as ETLJobData,
        id: docSnap.id
      };
    } catch (error) {
      console.error(`Error fetching ETL job ${jobId}:`, error);
      throw error;
    }
  }
};

export default etlJobService; 