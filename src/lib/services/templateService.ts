// import { 
//   doc, 
//   collection, 
//   getDoc, 
//   getDocs, 
//   setDoc, 
//   updateDoc, 
//   deleteDoc, 
//   query, 
//   where, 
//   orderBy, 
//   serverTimestamp, 
//   Timestamp
// } from 'firebase/firestore' // Firebase SDK
// import { db } from '@/lib/firebase/firebase' // Firebase db is null
import { Template, TemplateSection } from '@/lib/types/template'
// import { v4 as uuidv4 } from 'uuid' // Only needed if createTemplate generates actual ID

const SERVICE_DISABLED_MSG = "templateService: Firebase backend has been removed. Method called but will not perform DB operations. TODO: Implement with Supabase.";

// Collection reference
// const templatesCollection = 'templates' // No longer used directly

// Service methods for managing templates
export const templateService = {
  // Get template by ID
  async getTemplate(templateId: string): Promise<Template | null> {
    console.warn(`getTemplate(${templateId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve(null);
  },

  // Get templates for a user
  async getUserTemplates(userId: string): Promise<Template[]> {
    console.warn(`getUserTemplates(${userId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve([]);
  },

  // Create new template
  async createTemplate(userId: string, templateData: Partial<Template>): Promise<Template> {
    console.warn(`createTemplate for user (${userId}): ${SERVICE_DISABLED_MSG}`);
    const mockId = 'mock-' + Math.random().toString(36).substring(2, 9);
    
    // Construct a mock Template object ensuring all required fields are present
    // and only including optional fields if provided in templateData or with a sensible mock default.
    const newMockTemplate: Template = {
      id: mockId,
      userId: userId,
      name: templateData.name || 'Mocked Template',
      industry: templateData.industry || 'Mock Industry',
      category: templateData.category || 'Mock Category',
      sections: templateData.sections || [],
      views: templateData.views || 0,
      usageCount: templateData.usageCount || 0,
      isPublished: templateData.isPublished || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Optional fields from Template type
      description: templateData.description || 'Mock description',
      thumbnailUrl: templateData.thumbnailUrl || undefined,
      totalDuration: templateData.totalDuration || 0,
      soundId: templateData.soundId || undefined,
      soundTitle: templateData.soundTitle || undefined,
      soundAuthor: templateData.soundAuthor || undefined,
      soundUrl: templateData.soundUrl || undefined,
    };
    return Promise.resolve(newMockTemplate);
  },

  // Update template
  async updateTemplate(templateId: string, templateData: Partial<Template>): Promise<Template> {
    console.warn(`updateTemplate(${templateId}): ${SERVICE_DISABLED_MSG}`);
    // For a mock, we'd typically fetch the existing, then apply updates.
    // Here, we'll construct a mock base and apply templateData to it.
    const baseMockTemplate: Template = {
        id: templateId,
        userId: 'mock_user_id',
        name: 'Mocked Base Template',
        industry: 'Mock Industry',
        category: 'Mock Category',
        sections: [],
        views: 0,
        usageCount: 0,
        isPublished: false,
        createdAt: new Date(Date.now() - 100000).toISOString(), // Older date
        updatedAt: new Date(Date.now() - 50000).toISOString(), // Older update date
        description: 'Mock base description',
        thumbnailUrl: undefined,
        totalDuration: 0,
        soundId: undefined,
        soundTitle: undefined,
        soundAuthor: undefined,
        soundUrl: undefined,
      };

    const updatedMockTemplate: Template = {
      ...baseMockTemplate,
      ...templateData, // Apply partial updates from templateData
      updatedAt: new Date().toISOString(), // Set new update time
    };
    return Promise.resolve(updatedMockTemplate);
  },

  // Delete template
  async deleteTemplate(templateId: string): Promise<boolean> {
    console.warn(`deleteTemplate(${templateId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve(true);
  },

  // Track template views
  async incrementTemplateViews(templateId: string): Promise<void> {
    console.warn(`incrementTemplateViews(${templateId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },

  // Track template usage
  async incrementTemplateUsage(templateId: string): Promise<void> {
    console.warn(`incrementTemplateUsage(${templateId}): ${SERVICE_DISABLED_MSG}`);
    return Promise.resolve();
  },

  // Calculate total duration of a template
  calculateTotalDuration(sections: TemplateSection[]): number {
    return sections.reduce((sum, section) => sum + section.duration, 0);
  }
} 