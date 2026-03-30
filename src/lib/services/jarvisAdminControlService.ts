"use client";
import { eventBus } from '@/lib/services/serverEventBus'

interface ControlCapability {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'user' | 'content' | 'analytics' | 'security';
  permissions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
}

interface AdminAction {
  id: string;
  timestamp: Date;
  action: string;
  category: string;
  parameters: Record<string, any>;
  result: 'pending' | 'success' | 'error' | 'cancelled';
  executionTime?: number;
  error?: string;
}

interface SystemStatus {
  overallHealth: 'optimal' | 'warning' | 'critical' | 'error';
  services: {
    database: 'online' | 'offline' | 'degraded';
    api: 'online' | 'offline' | 'degraded';
    websocket: 'online' | 'offline' | 'degraded';
    analytics: 'online' | 'offline' | 'degraded';
    ml_pipeline: 'online' | 'offline' | 'degraded';
  };
  metrics: {
    activeUsers: number;
    videosProcessed: number;
    predictionAccuracy: number;
    systemLoad: number;
    memoryUsage: number;
  };
  alerts: Array<{
    id: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
  }>;
}

export class JarvisAdminControlService {
  private capabilities: ControlCapability[] = [];
  private actionHistory: AdminAction[] = [];
  private systemStatus!: SystemStatus;
  private subscribers: Map<string, (data: any) => void> = new Map();
  private isAuthorized = false;
  private securityLevel: 'basic' | 'elevated' | 'admin' | 'super_admin' = 'basic';

  constructor() {
    this.initializeCapabilities();
    this.initializeSystemStatus();
    this.connectToWebSocket();
    this.startSystemMonitoring();
  }

  // Initialize control capabilities
  private initializeCapabilities(): void {
    this.capabilities = [
      // System Control
      {
        id: 'system_restart',
        name: 'System Restart',
        description: 'Restart core system services',
        category: 'system',
        permissions: ['system.restart'],
        riskLevel: 'critical',
        requiresConfirmation: true
      },
      {
        id: 'database_backup',
        name: 'Database Backup',
        description: 'Create emergency database backup',
        category: 'system',
        permissions: ['database.backup'],
        riskLevel: 'medium',
        requiresConfirmation: false
      },
      {
        id: 'cache_clear',
        name: 'Clear Cache',
        description: 'Clear all system caches',
        category: 'system',
        permissions: ['system.cache'],
        riskLevel: 'low',
        requiresConfirmation: false
      },

      // User Management
      {
        id: 'user_suspend',
        name: 'Suspend User',
        description: 'Temporarily suspend user account',
        category: 'user',
        permissions: ['user.suspend'],
        riskLevel: 'high',
        requiresConfirmation: true
      },
      {
        id: 'user_promote',
        name: 'Promote User',
        description: 'Upgrade user to premium tier',
        category: 'user',
        permissions: ['user.promote'],
        riskLevel: 'medium',
        requiresConfirmation: false
      },
      {
        id: 'bulk_user_operation',
        name: 'Bulk User Operation',
        description: 'Perform operations on multiple users',
        category: 'user',
        permissions: ['user.bulk'],
        riskLevel: 'high',
        requiresConfirmation: true
      },

      // Content Management
      {
        id: 'video_reprocess',
        name: 'Reprocess Videos',
        description: 'Rerun ML analysis on video batch',
        category: 'content',
        permissions: ['content.reprocess'],
        riskLevel: 'medium',
        requiresConfirmation: false
      },
      {
        id: 'content_moderate',
        name: 'Content Moderation',
        description: 'Flag/unflag content for review',
        category: 'content',
        permissions: ['content.moderate'],
        riskLevel: 'medium',
        requiresConfirmation: false
      },
      {
        id: 'trend_override',
        name: 'Override Trend Prediction',
        description: 'Manually override AI trend predictions',
        category: 'content',
        permissions: ['content.override'],
        riskLevel: 'high',
        requiresConfirmation: true
      },

      // Analytics Control
      {
        id: 'report_generate',
        name: 'Generate Reports',
        description: 'Create comprehensive analytics reports',
        category: 'analytics',
        permissions: ['analytics.report'],
        riskLevel: 'low',
        requiresConfirmation: false
      },
      {
        id: 'data_export',
        name: 'Export Data',
        description: 'Export platform data for analysis',
        category: 'analytics',
        permissions: ['analytics.export'],
        riskLevel: 'medium',
        requiresConfirmation: true
      },
      {
        id: 'algorithm_retrain',
        name: 'Retrain Algorithms',
        description: 'Trigger ML model retraining',
        category: 'analytics',
        permissions: ['analytics.retrain'],
        riskLevel: 'high',
        requiresConfirmation: true
      },

      // Security Operations
      {
        id: 'security_scan',
        name: 'Security Scan',
        description: 'Run comprehensive security audit',
        category: 'security',
        permissions: ['security.scan'],
        riskLevel: 'low',
        requiresConfirmation: false
      },
      {
        id: 'access_revoke',
        name: 'Revoke Access',
        description: 'Emergency access revocation',
        category: 'security',
        permissions: ['security.revoke'],
        riskLevel: 'critical',
        requiresConfirmation: true
      },
      {
        id: 'audit_log_export',
        name: 'Export Audit Logs',
        description: 'Export security audit logs',
        category: 'security',
        permissions: ['security.audit'],
        riskLevel: 'high',
        requiresConfirmation: true
      }
    ];
  }

  // Initialize system status
  private initializeSystemStatus(): void {
    this.systemStatus = {
      overallHealth: 'optimal',
      services: {
        database: 'online',
        api: 'online',
        websocket: 'online',
        analytics: 'online',
        ml_pipeline: 'online'
      },
      metrics: {
        activeUsers: 1247,
        videosProcessed: 26453,
        predictionAccuracy: 91.3,
        systemLoad: 23.4,
        memoryUsage: 68.2
      },
      alerts: []
    };
  }

  // Connect to server event bus for real-time updates
  private _unsub?: () => void;
  private connectToWebSocket(): void {
    this._unsub?.();
    this._unsub = eventBus.subscribe('admin_control', (message: any) => this.handleWebSocketMessage(message))
  }

  // Handle WebSocket messages
  private handleWebSocketMessage(message: any): void {
    switch (message.type) {
      case 'system_status_update':
        this.updateSystemStatus(message.data);
        break;
      case 'admin_action_result':
        this.handleActionResult(message.data);
        break;
      case 'security_alert':
        this.handleSecurityAlert(message.data);
        break;
    }
  }

  // Execute admin command
  public async executeCommand(
    commandId: string, 
    parameters: Record<string, any> = {},
    skipConfirmation = false
  ): Promise<AdminAction> {
    const capability = this.capabilities.find(c => c.id === commandId);
    
    if (!capability) {
      throw new Error(`Unknown command: ${commandId}`);
    }

    // Security check
    if (!this.hasPermission(capability.permissions)) {
      throw new Error(`Insufficient permissions for: ${capability.name}`);
    }

    // Confirmation check
    if (capability.requiresConfirmation && !skipConfirmation) {
      throw new Error(`Command ${capability.name} requires confirmation`);
    }

    const action: AdminAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action: commandId,
      category: capability.category,
      parameters,
      result: 'pending'
    };

    this.actionHistory.push(action);
    this.notifySubscribers('action_started', action);

    try {
      const startTime = Date.now();
      
      // Execute the command
      await this.executeSpecificCommand(commandId, parameters);
      
      action.result = 'success';
      action.executionTime = Date.now() - startTime;
      
    } catch (error) {
      action.result = 'error';
      action.error = error instanceof Error ? error.message : 'Unknown error';
      action.executionTime = Date.now() - Date.now();
    }

    this.notifySubscribers('action_completed', action);
    return action;
  }

  // Execute specific commands
  private async executeSpecificCommand(commandId: string, parameters: Record<string, any>): Promise<void> {
    switch (commandId) {
      case 'system_restart':
        await this.restartSystem();
        break;
      
      case 'database_backup':
        await this.createDatabaseBackup();
        break;
      
      case 'cache_clear':
        await this.clearCache();
        break;
      
      case 'user_suspend':
        await this.suspendUser(parameters.userId);
        break;
      
      case 'user_promote':
        await this.promoteUser(parameters.userId, parameters.tier);
        break;
      
      case 'video_reprocess':
        await this.reprocessVideos(parameters.videoIds);
        break;
      
      case 'report_generate':
        await this.generateReport(parameters.reportType, parameters.timeRange);
        break;
      
      case 'data_export':
        await this.exportData(parameters.dataType, parameters.format);
        break;
      
      case 'security_scan':
        await this.runSecurityScan();
        break;
      
      default:
        throw new Error(`Command not implemented: ${commandId}`);
    }
  }

  // Specific command implementations
  private async restartSystem(): Promise<void> {
    // Publish restart command
    eventBus.publish('admin_command', { command: 'system_restart', timestamp: new Date().toISOString(), source: 'jarvis_admin' })
    
    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async createDatabaseBackup(): Promise<void> {
    const response = await fetch('/api/admin/database/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'jarvis' })
    });
    
    if (!response.ok) {
      throw new Error('Database backup failed');
    }
  }

  private async clearCache(): Promise<void> {
    const response = await fetch('/api/admin/system/cache/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Cache clear failed');
    }
  }

  private async suspendUser(userId: string): Promise<void> {
    const response = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Suspended via JARVIS', source: 'jarvis' })
    });
    
    if (!response.ok) {
      throw new Error('User suspension failed');
    }
  }

  private async promoteUser(userId: string, tier: string): Promise<void> {
    const response = await fetch(`/api/admin/users/${userId}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier, source: 'jarvis' })
    });
    
    if (!response.ok) {
      throw new Error('User promotion failed');
    }
  }

  private async reprocessVideos(videoIds: string[]): Promise<void> {
    const response = await fetch('/api/admin/videos/reprocess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoIds, source: 'jarvis' })
    });
    
    if (!response.ok) {
      throw new Error('Video reprocessing failed');
    }
  }

  private async generateReport(reportType: string, timeRange: string): Promise<void> {
    const response = await fetch('/api/admin/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportType, timeRange, source: 'jarvis' })
    });
    
    if (!response.ok) {
      throw new Error('Report generation failed');
    }
  }

  private async exportData(dataType: string, format: string): Promise<void> {
    const response = await fetch('/api/admin/data/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataType, format, source: 'jarvis' })
    });
    
    if (!response.ok) {
      throw new Error('Data export failed');
    }
  }

  private async runSecurityScan(): Promise<void> {
    const response = await fetch('/api/admin/security/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source: 'jarvis' })
    });
    
    if (!response.ok) {
      throw new Error('Security scan failed');
    }
  }

  // System monitoring
  private startSystemMonitoring(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update every 30 seconds
  }

  private updateMetrics(): void {
    // Simulate metric updates (in real implementation, fetch from APIs)
    this.systemStatus.metrics = {
      ...this.systemStatus.metrics,
      activeUsers: this.systemStatus.metrics.activeUsers + Math.floor(Math.random() * 10 - 5),
      videosProcessed: this.systemStatus.metrics.videosProcessed + Math.floor(Math.random() * 5),
      systemLoad: Math.max(0, Math.min(100, this.systemStatus.metrics.systemLoad + Math.random() * 10 - 5))
    };

    this.notifySubscribers('metrics_update', this.systemStatus.metrics);
  }

  // System status management
  private updateSystemStatus(statusUpdate: Partial<SystemStatus>): void {
    this.systemStatus = { ...this.systemStatus, ...statusUpdate };
    this.notifySubscribers('status_update', this.systemStatus);
  }

  private handleActionResult(result: any): void {
    const action = this.actionHistory.find(a => a.id === result.actionId);
    if (action) {
      action.result = result.success ? 'success' : 'error';
      action.error = result.error;
      action.executionTime = result.executionTime;
    }
    
    this.notifySubscribers('action_result', result);
  }

  private handleSecurityAlert(alert: any): void {
    this.systemStatus.alerts.push({
      id: alert.id,
      severity: alert.severity,
      message: alert.message,
      timestamp: new Date(alert.timestamp)
    });

    // Keep only recent alerts
    this.systemStatus.alerts = this.systemStatus.alerts.slice(-50);
    
    this.notifySubscribers('security_alert', alert);
  }

  // Permission checking
  private hasPermission(requiredPermissions: string[]): boolean {
    // In real implementation, check user permissions
    // For now, assume super admin has all permissions
    return this.securityLevel === 'super_admin';
  }

  // Public interface methods
  public getCapabilities(category?: string): ControlCapability[] {
    if (category) {
      return this.capabilities.filter(c => c.category === category);
    }
    return [...this.capabilities];
  }

  public getSystemStatus(): SystemStatus {
    return { ...this.systemStatus };
  }

  public getActionHistory(limit = 50): AdminAction[] {
    return this.actionHistory.slice(-limit);
  }

  public setSecurityLevel(level: 'basic' | 'elevated' | 'admin' | 'super_admin'): void {
    this.securityLevel = level;
    this.notifySubscribers('security_level_changed', { level });
  }

  public authorize(token: string): boolean {
    // In real implementation, validate auth token
    // For now, assume authorization is successful
    this.isAuthorized = true;
    this.securityLevel = 'super_admin';
    this.notifySubscribers('authorization_success', { level: this.securityLevel });
    return true;
  }

  // Command processing from voice
  public async processVoiceCommand(command: string): Promise<string> {
    const lowerCommand = command.toLowerCase();

    // System status commands
    if (lowerCommand.includes('system status') || lowerCommand.includes('health check')) {
      return this.getSystemStatusReport();
    }

    if (lowerCommand.includes('show alerts') || lowerCommand.includes('any alerts')) {
      return this.getAlertsReport();
    }

    if (lowerCommand.includes('show capabilities') || lowerCommand.includes('what can you do')) {
      return this.getCapabilitiesReport();
    }

    // Direct command execution
    for (const capability of this.capabilities) {
      if (lowerCommand.includes(capability.name.toLowerCase())) {
        try {
          const action = await this.executeCommand(capability.id);
          return `${capability.name} executed successfully. Action ID: ${action.id}`;
        } catch (error) {
          return `Failed to execute ${capability.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
      }
    }

    return `I don't recognize that command. Say "show capabilities" to see available commands.`;
  }

  // Report generation
  private getSystemStatusReport(): string {
    const status = this.systemStatus;
    const criticalAlerts = status.alerts.filter(a => a.severity === 'critical').length;
    
    return `System Status: ${status.overallHealth.toUpperCase()}. 
           ${status.metrics.activeUsers} active users, 
           ${status.metrics.videosProcessed.toLocaleString()} videos processed, 
           ${status.metrics.predictionAccuracy}% accuracy. 
           System load: ${status.metrics.systemLoad.toFixed(1)}%. 
           ${criticalAlerts > 0 ? `${criticalAlerts} critical alerts active.` : 'No critical alerts.'}`;
  }

  private getAlertsReport(): string {
    const alerts = this.systemStatus.alerts;
    if (alerts.length === 0) {
      return 'No active alerts. All systems operating normally.';
    }

    const critical = alerts.filter(a => a.severity === 'critical').length;
    const warning = alerts.filter(a => a.severity === 'warning').length;
    const recent = alerts.slice(-3).map(a => `${a.severity}: ${a.message}`).join('. ');

    return `${alerts.length} total alerts: ${critical} critical, ${warning} warnings. Recent: ${recent}`;
  }

  private getCapabilitiesReport(): string {
    const categories = [...new Set(this.capabilities.map(c => c.category))];
    const categoryCount = categories.map(cat => {
      const count = this.capabilities.filter(c => c.category === cat).length;
      return `${count} ${cat}`;
    }).join(', ');

    return `I have ${this.capabilities.length} admin capabilities across ${categories.length} categories: ${categoryCount}. Say the name of any capability to execute it.`;
  }

  // Subscription management
  public subscribe(id: string, callback: (data: any) => void): () => void {
    this.subscribers.set(id, callback);
    return () => this.subscribers.delete(id);
  }

  private notifySubscribers(event: string, data: any): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ event, data, timestamp: new Date() });
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Cleanup
  public destroy(): void {
    this.subscribers.clear();
  }
}

// Singleton instance
let adminControlInstance: JarvisAdminControlService | null = null;

export const getJarvisAdminControlService = (): JarvisAdminControlService => {
  if (!adminControlInstance) {
    adminControlInstance = new JarvisAdminControlService();
  }
  return adminControlInstance;
};

export default JarvisAdminControlService; 