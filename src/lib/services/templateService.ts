import { 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase/firebase'
import { Template, TemplateSection } from '@/lib/types/template'
import { v4 as uuidv4 } from 'uuid'

// Collection reference
const templatesCollection = 'templates'

// Service methods for managing templates
export const templateService = {
  // Get template by ID
  async getTemplate(templateId: string): Promise<Template | null> {
    try {
      const templateDoc = await getDoc(doc(db, templatesCollection, templateId))
      if (!templateDoc.exists()) return null
      
      return {
        ...templateDoc.data() as Template,
        id: templateDoc.id,
        createdAt: (templateDoc.data().createdAt as Timestamp).toDate().toISOString(),
        updatedAt: (templateDoc.data().updatedAt as Timestamp).toDate().toISOString()
      }
    } catch (error) {
      console.error('Error fetching template:', error)
      throw error
    }
  },

  // Get templates for a user
  async getUserTemplates(userId: string): Promise<Template[]> {
    try {
      const q = query(
        collection(db, templatesCollection),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        ...doc.data() as Template,
        id: doc.id,
        createdAt: (doc.data().createdAt as Timestamp).toDate().toISOString(),
        updatedAt: (doc.data().updatedAt as Timestamp).toDate().toISOString()
      }))
    } catch (error) {
      console.error('Error fetching user templates:', error)
      throw error
    }
  },

  // Create new template
  async createTemplate(userId: string, templateData: Partial<Template>): Promise<Template> {
    try {
      const templateId = uuidv4()
      const now = serverTimestamp()
      
      // Create a template with default values if not provided
      const newTemplate: Partial<Template> = {
        name: templateData.name || 'Untitled Template',
        industry: templateData.industry || 'General',
        category: templateData.category || 'Other',
        sections: templateData.sections || [],
        views: 0,
        usageCount: 0,
        isPublished: false,
        userId,
        createdAt: now,
        updatedAt: now,
        ...templateData
      }
      
      await setDoc(doc(db, templatesCollection, templateId), newTemplate)
      
      // Return the created template (with a placeholder for the timestamps)
      return {
        ...newTemplate as Template,
        id: templateId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error creating template:', error)
      throw error
    }
  },

  // Update template
  async updateTemplate(templateId: string, templateData: Partial<Template>): Promise<Template> {
    try {
      const templateRef = doc(db, templatesCollection, templateId)
      
      // Get current template data
      const templateDoc = await getDoc(templateRef)
      if (!templateDoc.exists()) {
        throw new Error('Template not found')
      }
      
      // Update template with new data
      const updatedTemplate = {
        ...templateData,
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(templateRef, updatedTemplate)
      
      // Return the updated template
      return {
        ...templateDoc.data() as Template,
        ...templateData,
        id: templateId,
        updatedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error updating template:', error)
      throw error
    }
  },

  // Delete template
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, templatesCollection, templateId))
      return true
    } catch (error) {
      console.error('Error deleting template:', error)
      throw error
    }
  },

  // Track template views
  async incrementTemplateViews(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, templatesCollection, templateId)
      const templateDoc = await getDoc(templateRef)
      
      if (templateDoc.exists()) {
        const currentViews = templateDoc.data().views || 0
        await updateDoc(templateRef, {
          views: currentViews + 1,
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error incrementing template views:', error)
      throw error
    }
  },

  // Track template usage
  async incrementTemplateUsage(templateId: string): Promise<void> {
    try {
      const templateRef = doc(db, templatesCollection, templateId)
      const templateDoc = await getDoc(templateRef)
      
      if (templateDoc.exists()) {
        const currentUsage = templateDoc.data().usageCount || 0
        await updateDoc(templateRef, {
          usageCount: currentUsage + 1,
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error incrementing template usage:', error)
      throw error
    }
  },

  // Calculate total duration of a template
  calculateTotalDuration(sections: TemplateSection[]): number {
    return sections.reduce((sum, section) => sum + section.duration, 0)
  }
} 