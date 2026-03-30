import { createClient } from '@supabase/supabase-js';
import { AnalyticsService } from './AnalyticsService';
import { ChangePreviewService } from './ChangePreviewService';
import { CommandParser } from './CommandParser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface BrainAction {
  action: string;
  target: string;
  params?: Record<string, any>;
  preview?: boolean;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  preview_data?: any;
  requires_approval?: boolean;
}

export class ActionDispatcher {
  private analyticsService = AnalyticsService.getInstance();
  private previewService = ChangePreviewService.getInstance();
  private commandParser = CommandParser.getInstance();

  async dispatch(action: BrainAction): Promise<ActionResult> {
    const startTime = Date.now();
    let result: ActionResult = { success: false, message: 'Unknown error' };
    
    try {
      // Log the action attempt
      await this.logAction(action, false, startTime);

      // Handle different action types with enhanced capabilities
      switch (action.action) {
        case 'analytics':
          result = await this.executeAnalytics(action.target, action.params || {});
          break;
        case 'update_rule':
          result = await this.executeUpdateRule(action.target, action.params || {}, action.preview);
          break;
        case 'preview':
          result = await this.executePreview(action.target, action.params || {});
          break;
        case 'run':
          result = await this.executeRun(action.target);
          break;
        case 'micro':
          result = await this.executeMicro(action.target);
          break;
        case 'macro_track':
          result = await this.executeMacroTrack(action.target);
          break;
        case 'module':
          result = await this.executeModule(action.target);
          break;
        default:
          result = { success: false, message: `Unknown action: ${action.action}` };
      }

      // Update log with success status
      await this.logAction(action, result.success, startTime);
      
      return result;
    } catch (error) {
      console.error('ActionDispatcher error:', error);
      await this.logAction(action, false, startTime);
      return { success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Enhanced action executors
  private async executeAnalytics(target: string, params: Record<string, any>): Promise<ActionResult> {
    try {
      const data = await this.analyticsService.executeAnalyticsQuery(target, params);
      
      return {
        success: true,
        message: `Analytics data retrieved for ${target}`,
        data
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to retrieve analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeUpdateRule(target: string, params: Record<string, any>, preview?: boolean): Promise<ActionResult> {
    try {
      if (preview) {
        // Generate preview instead of executing
        const previewData = await this.previewService.previewThresholdChange(params.new_value, target);
        
        return {
          success: true,
          message: `Preview generated for updating ${target}`,
          preview_data: previewData,
          requires_approval: previewData.approval_required
        };
      } else {
        // Execute actual update
        const success = await this.updateSystemRule(target, params);
        
        return {
          success,
          message: success ? `Successfully updated ${target}` : `Failed to update ${target}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error updating rule: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executePreview(target: string, params: Record<string, any>): Promise<ActionResult> {
    try {
      const preview = await this.previewService.generateChangePreview(target, params);
      const visualGraph = await this.previewService.generateVisualGraph(preview);
      
      return {
        success: true,
        message: `Change preview generated for ${target}`,
        preview_data: {
          preview,
          visual_graph: visualGraph
        },
        requires_approval: preview.approval_required
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeRun(target: string): Promise<ActionResult> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/pipeline-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          moduleId: target,
          action: 'run'
        }),
      });
      
      const success = response.ok;
      return {
        success,
        message: success ? `Successfully started ${target}` : `Failed to start ${target}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Execute run error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeMicro(target: string): Promise<ActionResult> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/pipeline-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          track: 'micro',
          action: 'run'
        }),
      });
      
      const success = response.ok;
      return {
        success,
        message: success ? 'Micro track analysis started' : 'Failed to start micro track analysis'
      };
    } catch (error) {
      return {
        success: false,
        message: `Execute micro error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeMacroTrack(target: string): Promise<ActionResult> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/pipeline-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          track: 'macro',
          action: 'run'
        }),
      });
      
      const success = response.ok;
      return {
        success,
        message: success ? 'Macro track pipeline started' : 'Failed to start macro track pipeline'
      };
    } catch (error) {
      return {
        success: false,
        message: `Execute macro track error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async executeModule(target: string): Promise<ActionResult> {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/pipeline-actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          moduleId: target,
          action: 'run'
        }),
      });
      
      const success = response.ok;
      return {
        success,
        message: success ? `Module ${target} executed successfully` : `Failed to execute module ${target}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Execute module error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async updateSystemRule(target: string, params: Record<string, any>): Promise<boolean> {
    try {
      // Mock implementation - would update actual system rules
      console.log(`Updating rule ${target} with params:`, params);
      
      // Simulate rule update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return Math.random() > 0.1; // 90% success rate
    } catch (error) {
      console.error('Error updating system rule:', error);
      return false;
    }
  }

  private async logAction(action: BrainAction, success: boolean, startTime: number): Promise<void> {
    try {
      await supabase.from('brain_actions').insert({
        json_action: JSON.stringify(action),
        success,
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }
}