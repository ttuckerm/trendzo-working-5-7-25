import { AiBrainResponse } from '@/types/ai-brain.types';

/**
 * Service to interact with the AI Brain API
 */
export const AiBrainService = {
  /**
   * Send a message to the AI Brain and get a response
   * @param message The message to send to the AI Brain
   * @returns The AI Brain response
   */
  async sendMessage(message: string): Promise<AiBrainResponse> {
    try {
      const response = await fetch('/api/admin/ai-brain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message to AI Brain');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message to AI Brain:', error);
      throw error;
    }
  },
  
  /**
   * Apply a framework update
   * @param updateId The ID of the update to apply
   * @returns A success message
   */
  async applyUpdate(updateId: string): Promise<{ success: boolean, message: string }> {
    try {
      const response = await fetch('/api/admin/ai-brain/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updateId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply framework update');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error applying framework update:', error);
      throw error;
    }
  },
  
  /**
   * Get the conversation history
   * @returns The conversation history
   */
  async getConversationHistory(): Promise<any[]> {
    try {
      const response = await fetch('/api/admin/ai-brain/history');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get conversation history');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  },
  
  /**
   * Get the framework components
   * @returns The framework components
   */
  async getFrameworkComponents(): Promise<any[]> {
    try {
      const response = await fetch('/api/admin/ai-brain/frameworks');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get framework components');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting framework components:', error);
      throw error;
    }
  },
};

export default AiBrainService; 