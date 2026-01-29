import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export interface ChangeImpact {
  id: string;
  type: 'rule_update' | 'threshold_change' | 'module_config' | 'pipeline_setting';
  description: string;
  risk_level: 'low' | 'medium' | 'high';
  affected_components: string[];
  estimated_impact: {
    templates_affected: number;
    accuracy_change: number;
    performance_impact: string;
    rollback_complexity: 'easy' | 'moderate' | 'difficult';
  };
  dependencies: string[];
  conflicts: string[];
  preview_data: any;
  created_at: string;
  created_by: string;
}

export interface ChangePreview {
  change_id: string;
  current_state: any;
  proposed_state: any;
  diff: any;
  impact_analysis: ChangeImpact;
  simulation_results?: {
    success_probability: number;
    affected_templates: Array<{
      id: string;
      title: string;
      current_score: number;
      predicted_score: number;
      change_magnitude: number;
    }>;
    system_metrics_projection: {
      accuracy_change: number;
      processing_speed_change: number;
      error_rate_change: number;
    };
  };
  approval_required: boolean;
  auto_rollback_enabled: boolean;
}

export interface VisualChangeGraph {
  nodes: Array<{
    id: string;
    type: 'template' | 'rule' | 'module' | 'metric';
    label: string;
    impact_level: 'none' | 'low' | 'medium' | 'high';
    current_value?: any;
    proposed_value?: any;
  }>;
  edges: Array<{
    source: string;
    target: string;
    relationship: 'affects' | 'depends_on' | 'conflicts_with';
    weight: number;
  }>;
  affected_paths: string[][];
}

export class ChangePreviewService {
  private static instance: ChangePreviewService;

  static getInstance(): ChangePreviewService {
    if (!ChangePreviewService.instance) {
      ChangePreviewService.instance = new ChangePreviewService();
    }
    return ChangePreviewService.instance;
  }

  // Generate comprehensive change preview
  async generateChangePreview(
    changeType: string,
    parameters: Record<string, any>,
    context?: any
  ): Promise<ChangePreview> {
    const changeId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Analyze current state
      const currentState = await this.getCurrentState(changeType, parameters);
      
      // Generate proposed state
      const proposedState = await this.generateProposedState(changeType, parameters, currentState);
      
      // Calculate diff
      const diff = this.calculateDiff(currentState, proposedState);
      
      // Perform impact analysis
      const impactAnalysis = await this.analyzeImpact(changeType, parameters, currentState, proposedState);
      
      // Run simulation if needed
      const simulationResults = await this.runSimulation(changeType, parameters, impactAnalysis);
      
      return {
        change_id: changeId,
        current_state: currentState,
        proposed_state: proposedState,
        diff,
        impact_analysis: impactAnalysis,
        simulation_results: simulationResults,
        approval_required: impactAnalysis.risk_level === 'high' || impactAnalysis.estimated_impact.templates_affected > 10,
        auto_rollback_enabled: this.shouldEnableAutoRollback(impactAnalysis)
      };
    } catch (error) {
      console.error('Error generating change preview:', error);
      throw new Error(`Failed to generate change preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Generate visual change graph for UI display
  async generateVisualGraph(changePreview: ChangePreview): Promise<VisualChangeGraph> {
    const nodes: VisualChangeGraph['nodes'] = [];
    const edges: VisualChangeGraph['edges'] = [];
    
    try {
      // Add central change node
      nodes.push({
        id: 'change_root',
        type: 'rule',
        label: changePreview.impact_analysis.description,
        impact_level: changePreview.impact_analysis.risk_level as any
      });

      // Add affected components as nodes
      for (const component of changePreview.impact_analysis.affected_components) {
        nodes.push({
          id: component,
          type: this.getComponentType(component),
          label: this.formatComponentLabel(component),
          impact_level: this.calculateComponentImpact(component, changePreview)
        });

        // Connect to change root
        edges.push({
          source: 'change_root',
          target: component,
          relationship: 'affects',
          weight: this.calculateImpactWeight(component, changePreview)
        });
      }

      // Add template nodes if templates are affected
      if (changePreview.simulation_results?.affected_templates) {
        for (const template of changePreview.simulation_results.affected_templates) {
          nodes.push({
            id: `template_${template.id}`,
            type: 'template',
            label: template.title,
            impact_level: this.getTemplateImpactLevel(template.change_magnitude),
            current_value: template.current_score,
            proposed_value: template.predicted_score
          });

          // Connect templates to relevant components
          for (const component of changePreview.impact_analysis.affected_components) {
            if (this.isTemplateAffectedByComponent(template, component)) {
              edges.push({
                source: component,
                target: `template_${template.id}`,
                relationship: 'affects',
                weight: Math.abs(template.change_magnitude)
              });
            }
          }
        }
      }

      // Add dependency relationships
      for (const dependency of changePreview.impact_analysis.dependencies) {
        if (nodes.find(n => n.id === dependency)) {
          edges.push({
            source: dependency,
            target: 'change_root',
            relationship: 'depends_on',
            weight: 0.8
          });
        }
      }

      // Add conflict relationships
      for (const conflict of changePreview.impact_analysis.conflicts) {
        if (nodes.find(n => n.id === conflict)) {
          edges.push({
            source: 'change_root',
            target: conflict,
            relationship: 'conflicts_with',
            weight: 1.0
          });
        }
      }

      // Calculate affected paths
      const affectedPaths = this.calculateAffectedPaths(nodes, edges);

      return {
        nodes,
        edges,
        affected_paths: affectedPaths
      };
    } catch (error) {
      console.error('Error generating visual graph:', error);
      throw new Error('Failed to generate visual change graph');
    }
  }

  // Preview specific change types
  async previewThresholdChange(newThreshold: number, ruleType: string): Promise<ChangePreview> {
    return this.generateChangePreview('threshold_change', {
      new_value: newThreshold,
      rule_type: ruleType
    });
  }

  async previewModuleConfiguration(moduleId: string, newConfig: any): Promise<ChangePreview> {
    return this.generateChangePreview('module_config', {
      module_id: moduleId,
      configuration: newConfig
    });
  }

  async previewPipelineSettings(settings: any): Promise<ChangePreview> {
    return this.generateChangePreview('pipeline_setting', {
      settings
    });
  }

  // Execute approved changes with monitoring
  async executeChange(changePreview: ChangePreview, approvedBy: string): Promise<{ success: boolean; changeId: string; rollbackId?: string }> {
    const executionId = `exec_${Date.now()}`;
    
    try {
      // Log change execution start
      await this.logChangeExecution(changePreview, 'started', approvedBy);
      
      // Create rollback point
      const rollbackId = await this.createRollbackPoint(changePreview);
      
      // Execute the actual change
      const success = await this.applyChanges(changePreview);
      
      if (success) {
        await this.logChangeExecution(changePreview, 'completed', approvedBy);
        
        // Schedule monitoring for auto-rollback if needed
        if (changePreview.auto_rollback_enabled) {
          await this.scheduleMonitoring(changePreview.change_id, rollbackId);
        }
        
        return { success: true, changeId: changePreview.change_id, rollbackId };
      } else {
        await this.logChangeExecution(changePreview, 'failed', approvedBy);
        return { success: false, changeId: changePreview.change_id };
      }
    } catch (error) {
      console.error('Error executing change:', error);
      await this.logChangeExecution(changePreview, 'error', approvedBy);
      throw error;
    }
  }

  // Rollback functionality
  async rollbackChange(rollbackId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get rollback data
      const { data: rollbackData, error } = await supabase
        .from('change_rollbacks')
        .select('*')
        .eq('id', rollbackId)
        .single();

      if (error || !rollbackData) {
        throw new Error('Rollback point not found');
      }

      // Apply rollback
      const success = await this.applyRollback(rollbackData);
      
      if (success) {
        await this.logRollback(rollbackId, 'completed', reason);
        return { success: true, message: 'Change successfully rolled back' };
      } else {
        await this.logRollback(rollbackId, 'failed', reason);
        return { success: false, message: 'Rollback failed' };
      }
    } catch (error) {
      console.error('Error during rollback:', error);
      return { success: false, message: `Rollback error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  // Private helper methods
  private async getCurrentState(changeType: string, parameters: any): Promise<any> {
    switch (changeType) {
      case 'threshold_change':
        return await this.getCurrentThresholds(parameters.rule_type);
      case 'module_config':
        return await this.getCurrentModuleConfig(parameters.module_id);
      case 'pipeline_setting':
        return await this.getCurrentPipelineSettings();
      default:
        return {};
    }
  }

  private async generateProposedState(changeType: string, parameters: any, currentState: any): Promise<any> {
    const proposed = { ...currentState };
    
    switch (changeType) {
      case 'threshold_change':
        proposed.viral_threshold = parameters.new_value;
        break;
      case 'module_config':
        proposed.configuration = { ...proposed.configuration, ...parameters.configuration };
        break;
      case 'pipeline_setting':
        Object.assign(proposed, parameters.settings);
        break;
    }
    
    return proposed;
  }

  private calculateDiff(current: any, proposed: any): any {
    const diff: any = {};
    
    for (const key in proposed) {
      if (current[key] !== proposed[key]) {
        diff[key] = {
          from: current[key],
          to: proposed[key],
          change_type: typeof current[key] !== typeof proposed[key] ? 'type_change' : 'value_change'
        };
      }
    }
    
    return diff;
  }

  private async analyzeImpact(changeType: string, parameters: any, currentState: any, proposedState: any): Promise<ChangeImpact> {
    // Simplified impact analysis - would be more sophisticated in production
    const affectedComponents = await this.identifyAffectedComponents(changeType, parameters);
    const templatesAffected = await this.countAffectedTemplates(changeType, parameters);
    
    return {
      id: `impact_${Date.now()}`,
      type: changeType as any,
      description: this.generateChangeDescription(changeType, parameters),
      risk_level: this.assessRiskLevel(changeType, parameters, templatesAffected),
      affected_components: affectedComponents,
      estimated_impact: {
        templates_affected: templatesAffected,
        accuracy_change: this.estimateAccuracyChange(changeType, parameters),
        performance_impact: this.estimatePerformanceImpact(changeType, parameters),
        rollback_complexity: this.assessRollbackComplexity(changeType)
      },
      dependencies: await this.identifyDependencies(changeType, parameters),
      conflicts: await this.identifyConflicts(changeType, parameters),
      preview_data: { currentState, proposedState },
      created_at: new Date().toISOString(),
      created_by: 'ai_brain'
    };
  }

  private async runSimulation(changeType: string, parameters: any, impact: ChangeImpact): Promise<any> {
    if (impact.risk_level === 'low') return null;
    
    // Mock simulation - would use actual ML models in production
    return {
      success_probability: Math.random() * 0.3 + 0.7, // 70-100%
      affected_templates: [],
      system_metrics_projection: {
        accuracy_change: Math.random() * 0.1 - 0.05, // -5% to +5%
        processing_speed_change: Math.random() * 0.2 - 0.1,
        error_rate_change: Math.random() * 0.05
      }
    };
  }

  private shouldEnableAutoRollback(impact: ChangeImpact): boolean {
    return impact.risk_level === 'high' || impact.estimated_impact.templates_affected > 20;
  }

  private async getCurrentThresholds(ruleType: string): Promise<any> {
    // Mock implementation
    return { viral_threshold: 0.8, engagement_threshold: 0.6 };
  }

  private async getCurrentModuleConfig(moduleId: string): Promise<any> {
    // Mock implementation
    return { enabled: true, parameters: {} };
  }

  private async getCurrentPipelineSettings(): Promise<any> {
    // Mock implementation
    return { batch_size: 100, timeout: 300 };
  }

  private async identifyAffectedComponents(changeType: string, parameters: any): Promise<string[]> {
    const components = [];
    
    switch (changeType) {
      case 'threshold_change':
        components.push('viral-filter', 'template-generator', 'evolution-engine');
        break;
      case 'module_config':
        components.push(parameters.module_id);
        break;
    }
    
    return components;
  }

  private async countAffectedTemplates(changeType: string, parameters: any): Promise<number> {
    // Mock implementation - would query actual data
    return Math.floor(Math.random() * 50) + 10;
  }

  private generateChangeDescription(changeType: string, parameters: any): string {
    switch (changeType) {
      case 'threshold_change':
        return `Update ${parameters.rule_type} threshold to ${parameters.new_value}`;
      case 'module_config':
        return `Configure ${parameters.module_id} module`;
      default:
        return 'System configuration change';
    }
  }

  private assessRiskLevel(changeType: string, parameters: any, templatesAffected: number): 'low' | 'medium' | 'high' {
    if (templatesAffected > 20) return 'high';
    if (templatesAffected > 10) return 'medium';
    return 'low';
  }

  private estimateAccuracyChange(changeType: string, parameters: any): number {
    // Mock estimation
    return Math.random() * 0.1 - 0.05; // -5% to +5%
  }

  private estimatePerformanceImpact(changeType: string, parameters: any): string {
    const impacts = ['minimal', 'moderate', 'significant'];
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  private assessRollbackComplexity(changeType: string): 'easy' | 'moderate' | 'difficult' {
    const complexities = ['easy', 'moderate', 'difficult'];
    return complexities[Math.floor(Math.random() * complexities.length)] as any;
  }

  private async identifyDependencies(changeType: string, parameters: any): Promise<string[]> {
    // Mock implementation
    return [];
  }

  private async identifyConflicts(changeType: string, parameters: any): Promise<string[]> {
    // Mock implementation
    return [];
  }

  private getComponentType(component: string): 'template' | 'rule' | 'module' | 'metric' {
    if (component.includes('filter') || component.includes('generator')) return 'module';
    if (component.includes('threshold')) return 'rule';
    return 'metric';
  }

  private formatComponentLabel(component: string): string {
    return component.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private calculateComponentImpact(component: string, preview: ChangePreview): 'none' | 'low' | 'medium' | 'high' {
    return preview.impact_analysis.risk_level as any;
  }

  private calculateImpactWeight(component: string, preview: ChangePreview): number {
    return Math.random() * 0.5 + 0.5; // 0.5 to 1.0
  }

  private getTemplateImpactLevel(changeMagnitude: number): 'none' | 'low' | 'medium' | 'high' {
    if (Math.abs(changeMagnitude) > 0.2) return 'high';
    if (Math.abs(changeMagnitude) > 0.1) return 'medium';
    if (Math.abs(changeMagnitude) > 0.05) return 'low';
    return 'none';
  }

  private isTemplateAffectedByComponent(template: any, component: string): boolean {
    // Simplified logic
    return true;
  }

  private calculateAffectedPaths(nodes: any[], edges: any[]): string[][] {
    // Simplified path calculation
    return [['change_root', 'viral-filter', 'template_1']];
  }

  private async logChangeExecution(preview: ChangePreview, status: string, user: string): Promise<void> {
    try {
      await supabase.from('change_executions').insert({
        change_id: preview.change_id,
        status,
        executed_by: user,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging change execution:', error);
    }
  }

  private async createRollbackPoint(preview: ChangePreview): Promise<string> {
    const rollbackId = `rollback_${Date.now()}`;
    
    try {
      await supabase.from('change_rollbacks').insert({
        id: rollbackId,
        change_id: preview.change_id,
        rollback_data: preview.current_state,
        created_at: new Date().toISOString()
      });
      
      return rollbackId;
    } catch (error) {
      console.error('Error creating rollback point:', error);
      throw error;
    }
  }

  private async applyChanges(preview: ChangePreview): Promise<boolean> {
    // Mock implementation - would apply actual changes
    return Math.random() > 0.1; // 90% success rate
  }

  private async scheduleMonitoring(changeId: string, rollbackId: string): Promise<void> {
    // Mock implementation - would schedule actual monitoring
    console.log(`Scheduled monitoring for change ${changeId} with rollback ${rollbackId}`);
  }

  private async applyRollback(rollbackData: any): Promise<boolean> {
    // Mock implementation - would apply actual rollback
    return Math.random() > 0.05; // 95% success rate
  }

  private async logRollback(rollbackId: string, status: string, reason: string): Promise<void> {
    try {
      await supabase.from('rollback_executions').insert({
        rollback_id: rollbackId,
        status,
        reason,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging rollback:', error);
    }
  }
}