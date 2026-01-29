/**
 * Security Monitoring & Alerting System
 * Real-time threat detection, incident logging, and automated response
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface SecurityEvent {
  id?: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  title: string;
  description: string;
  source: string;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  apiKeyId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  actionsTaken?: string[];
}

export enum SecurityEventType {
  // Authentication events
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  ACCOUNT_LOCKOUT = 'account_lockout',
  INVALID_API_KEY = 'invalid_api_key',
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  RATE_LIMIT_BURST = 'rate_limit_burst',
  
  // Attack attempts
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_ATTEMPT = 'csrf_attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  COMMAND_INJECTION_ATTEMPT = 'command_injection_attempt',
  
  // CORS violations
  CORS_VIOLATION = 'cors_violation',
  SUSPICIOUS_ORIGIN = 'suspicious_origin',
  
  // Data access
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration',
  
  // System events
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ANOMALOUS_BEHAVIOR = 'anomalous_behavior',
  MASS_REQUESTS = 'mass_requests',
  
  // Admin events
  ADMIN_LOGIN = 'admin_login',
  ADMIN_ACTION = 'admin_action',
  CONFIG_CHANGE = 'config_change',
  
  // Infrastructure
  HIGH_ERROR_RATE = 'high_error_rate',
  SYSTEM_OVERLOAD = 'system_overload',
  SERVICE_DEGRADATION = 'service_degradation'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ThreatPattern {
  pattern: RegExp | string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  description: string;
  autoBlock?: boolean;
}

export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<SecurityEventType, number>;
  eventsBySeverity: Record<SecuritySeverity, number>;
  topSources: Array<{ source: string; count: number }>;
  recentEvents: SecurityEvent[];
  alertsTriggered: number;
  actionsAutomated: number;
}

/**
 * Threat Detection Patterns
 */
const THREAT_PATTERNS: ThreatPattern[] = [
  // SQL Injection patterns
  {
    pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|UNION)\b.*\b(FROM|WHERE|INTO)\b)/i,
    type: SecurityEventType.SQL_INJECTION_ATTEMPT,
    severity: SecuritySeverity.HIGH,
    description: 'SQL injection pattern detected',
    autoBlock: true
  },
  
  // XSS patterns
  {
    pattern: /<script[^>]*>.*?<\/script>/gi,
    type: SecurityEventType.XSS_ATTEMPT,
    severity: SecuritySeverity.HIGH,
    description: 'XSS script tag detected',
    autoBlock: true
  },
  
  // Path traversal
  {
    pattern: /\.\.\//g,
    type: SecurityEventType.PATH_TRAVERSAL_ATTEMPT,
    severity: SecuritySeverity.MEDIUM,
    description: 'Path traversal attempt detected',
    autoBlock: true
  },
  
  // Command injection
  {
    pattern: /[;&|`$(){}[\]]/,
    type: SecurityEventType.COMMAND_INJECTION_ATTEMPT,
    severity: SecuritySeverity.HIGH,
    description: 'Command injection characters detected',
    autoBlock: true
  },
  
  // Suspicious user agents
  {
    pattern: /(sqlmap|nikto|nmap|masscan|nessus|burp|metasploit)/i,
    type: SecurityEventType.SUSPICIOUS_ACTIVITY,
    severity: SecuritySeverity.MEDIUM,
    description: 'Security scanning tool detected',
    autoBlock: false
  },
  
  // Mass requests pattern
  {
    pattern: /^\/api\/.*$/,
    type: SecurityEventType.MASS_REQUESTS,
    severity: SecuritySeverity.LOW,
    description: 'High frequency API requests',
    autoBlock: false
  }
];

/**
 * Security Monitoring Class
 */
export class SecurityMonitor {
  private supabase: any;
  private alertThresholds: Map<SecurityEventType, number>;
  private blockedIPs: Set<string>;
  private eventBuffer: SecurityEvent[];
  private alertCallbacks: Array<(event: SecurityEvent) => void>;

  constructor() {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }

    this.alertThresholds = new Map([
      [SecurityEventType.FAILED_LOGIN, 5],
      [SecurityEventType.RATE_LIMIT_EXCEEDED, 3],
      [SecurityEventType.SQL_INJECTION_ATTEMPT, 1],
      [SecurityEventType.XSS_ATTEMPT, 1],
      [SecurityEventType.UNAUTHORIZED_ACCESS, 2],
      [SecurityEventType.SUSPICIOUS_ACTIVITY, 10]
    ]);

    this.blockedIPs = new Set();
    this.eventBuffer = [];
    this.alertCallbacks = [];
    
    // Initialize background processes
    this.startBackgroundProcesses();
  }

  /**
   * Log a security event
   */
  async logEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    };

    // Add to buffer for real-time processing
    this.eventBuffer.push(securityEvent);

    // Store in database
    if (this.supabase) {
      try {
        await this.supabase
          .from('security_events')
          .insert({
            type: securityEvent.type,
            severity: securityEvent.severity,
            title: securityEvent.title,
            description: securityEvent.description,
            source: securityEvent.source,
            ip_address: securityEvent.ipAddress,
            user_agent: securityEvent.userAgent,
            user_id: securityEvent.userId,
            api_key_id: securityEvent.apiKeyId,
            endpoint: securityEvent.endpoint,
            method: securityEvent.method,
            status_code: securityEvent.statusCode,
            metadata: securityEvent.metadata,
            created_at: securityEvent.timestamp.toISOString()
          });
      } catch (error) {
        console.error('Failed to store security event:', error);
      }
    }

    // Check for immediate alerts
    await this.checkAlerts(securityEvent);

    // Take automated actions if needed
    await this.takeAutomatedAction(securityEvent);

    console.log(`🚨 Security Event [${securityEvent.severity.toUpperCase()}]:`, {
      type: securityEvent.type,
      source: securityEvent.source,
      ip: securityEvent.ipAddress,
      description: securityEvent.description
    });
  }

  /**
   * Analyze request for threats
   */
  async analyzeRequest(req: NextRequest): Promise<SecurityEvent[]> {
    const events: SecurityEvent[] = [];
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const url = new URL(req.url);
    const method = req.method;

    // Check if IP is blocked
    if (this.blockedIPs.has(ip)) {
      events.push({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        severity: SecuritySeverity.HIGH,
        title: 'Blocked IP Access Attempt',
        description: `Blocked IP ${ip} attempted to access ${url.pathname}`,
        source: ip,
        ipAddress: ip,
        userAgent,
        endpoint: url.pathname,
        method,
        timestamp: new Date()
      });
    }

    // Analyze URL and query parameters
    const fullUrl = req.url;
    const queryString = url.search;
    
    for (const pattern of THREAT_PATTERNS) {
      const regex = typeof pattern.pattern === 'string' ? 
        new RegExp(pattern.pattern, 'gi') : pattern.pattern;
      
      if (regex.test(fullUrl) || regex.test(queryString)) {
        events.push({
          type: pattern.type,
          severity: pattern.severity,
          title: `${pattern.type.replace('_', ' ').toUpperCase()} Detected`,
          description: pattern.description,
          source: ip,
          ipAddress: ip,
          userAgent,
          endpoint: url.pathname,
          method,
          metadata: {
            pattern: pattern.pattern.toString(),
            matchedUrl: fullUrl
          },
          timestamp: new Date()
        });
      }
    }

    // Analyze headers for suspicious patterns
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-original-ip',
      'cf-connecting-ip'
    ];

    for (const header of suspiciousHeaders) {
      const value = req.headers.get(header);
      if (value && this.containsSuspiciousContent(value)) {
        events.push({
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          severity: SecuritySeverity.MEDIUM,
          title: 'Suspicious Header Value',
          description: `Suspicious content in ${header} header`,
          source: ip,
          ipAddress: ip,
          userAgent,
          endpoint: url.pathname,
          method,
          metadata: {
            header,
            value: value.substring(0, 100) // Truncate for safety
          },
          timestamp: new Date()
        });
      }
    }

    // Check for rapid requests from same IP
    const recentRequests = this.getRecentRequestsByIP(ip);
    if (recentRequests > 100) { // More than 100 requests in last minute
      events.push({
        type: SecurityEventType.MASS_REQUESTS,
        severity: SecuritySeverity.MEDIUM,
        title: 'High Request Volume',
        description: `${recentRequests} requests from ${ip} in the last minute`,
        source: ip,
        ipAddress: ip,
        userAgent,
        endpoint: url.pathname,
        method,
        metadata: {
          requestCount: recentRequests,
          timeWindow: '1 minute'
        },
        timestamp: new Date()
      });
    }

    return events;
  }

  /**
   * Check if content contains suspicious patterns
   */
  private containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Get recent requests count by IP
   */
  private getRecentRequestsByIP(ip: string): number {
    const oneMinuteAgo = Date.now() - 60000;
    return this.eventBuffer.filter(event => 
      event.ipAddress === ip && 
      event.timestamp.getTime() > oneMinuteAgo
    ).length;
  }

  /**
   * Check for alert conditions
   */
  private async checkAlerts(event: SecurityEvent): Promise<void> {
    const threshold = this.alertThresholds.get(event.type);
    if (!threshold) return;

    // Count recent events of same type from same source
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recentEvents = this.eventBuffer.filter(e => 
      e.type === event.type && 
      e.source === event.source &&
      e.timestamp.getTime() > fiveMinutesAgo
    ).length;

    if (recentEvents >= threshold) {
      await this.triggerAlert(event, recentEvents, threshold);
    }
  }

  /**
   * Trigger security alert
   */
  private async triggerAlert(event: SecurityEvent, count: number, threshold: number): Promise<void> {
    const alert: SecurityEvent = {
      ...event,
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecuritySeverity.HIGH,
      title: `Alert: ${event.type} threshold exceeded`,
      description: `${count} events of type ${event.type} from ${event.source} exceeded threshold of ${threshold}`,
      metadata: {
        ...event.metadata,
        originalEvent: event,
        eventCount: count,
        threshold,
        alertTriggered: true
      },
      timestamp: new Date()
    };

    // Store alert
    await this.logEvent(alert);

    // Trigger alert callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Alert callback error:', error);
      }
    });

    console.log(`🚨 SECURITY ALERT: ${alert.title}`, {
      source: alert.source,
      count,
      threshold,
      eventType: event.type
    });
  }

  /**
   * Take automated security actions
   */
  private async takeAutomatedAction(event: SecurityEvent): Promise<void> {
    const actions: string[] = [];

    // Auto-block for high severity threats
    if (event.severity === SecuritySeverity.CRITICAL || 
        event.severity === SecuritySeverity.HIGH) {
      
      // Find matching pattern for auto-block
      const pattern = THREAT_PATTERNS.find(p => p.type === event.type);
      
      if (pattern?.autoBlock && event.ipAddress) {
        this.blockIP(event.ipAddress, `Auto-blocked for ${event.type}`);
        actions.push(`Blocked IP ${event.ipAddress}`);
      }
    }

    // Rate limit escalation
    if (event.type === SecurityEventType.RATE_LIMIT_EXCEEDED && event.ipAddress) {
      this.escalateRateLimit(event.ipAddress);
      actions.push(`Escalated rate limit for ${event.ipAddress}`);
    }

    // Log actions taken
    if (actions.length > 0) {
      event.actionsTaken = actions;
      console.log(`🤖 Automated actions taken:`, actions);
    }
  }

  /**
   * Block IP address
   */
  private blockIP(ip: string, reason: string): void {
    this.blockedIPs.add(ip);
    
    // Store in database for persistence
    if (this.supabase) {
      this.supabase
        .from('blocked_ips')
        .insert({
          ip_address: ip,
          reason,
          blocked_at: new Date().toISOString(),
          auto_blocked: true
        })
        .then(() => console.log(`🚫 IP ${ip} blocked: ${reason}`))
        .catch((error: any) => console.error('Failed to store blocked IP:', error));
    }
  }

  /**
   * Escalate rate limiting for IP
   */
  private escalateRateLimit(ip: string): void {
    // This would integrate with the rate limiter to reduce limits for this IP
    console.log(`⚡ Rate limit escalated for IP: ${ip}`);
  }

  /**
   * Get security metrics
   */
  async getMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<SecurityMetrics> {
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - timeRangeMs[timeRange]);

    let events: SecurityEvent[] = [];
    
    if (this.supabase) {
      try {
        const { data } = await this.supabase
          .from('security_events')
          .select('*')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false });
        
        events = data || [];
      } catch (error) {
        console.error('Failed to fetch security metrics:', error);
      }
    }

    // Calculate metrics
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventType, number>);

    const eventsBySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<SecuritySeverity, number>);

    const sourceCount = events.reduce((acc, event) => {
      acc[event.source] = (acc[event.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSources = Object.entries(sourceCount)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      topSources,
      recentEvents: events.slice(0, 20),
      alertsTriggered: events.filter(e => e.metadata?.alertTriggered).length,
      actionsAutomated: events.filter(e => e.actionsTaken?.length).length
    };
  }

  /**
   * Register alert callback
   */
  onAlert(callback: (event: SecurityEvent) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Start background monitoring processes
   */
  private startBackgroundProcesses(): void {
    // Clean up old events from buffer every 5 minutes
    setInterval(() => {
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      this.eventBuffer = this.eventBuffer.filter(event => 
        event.timestamp.getTime() > fiveMinutesAgo
      );
    }, 5 * 60 * 1000);

    // Load blocked IPs from database on startup
    this.loadBlockedIPs();
  }

  /**
   * Load blocked IPs from database
   */
  private async loadBlockedIPs(): Promise<void> {
    if (!this.supabase) return;

    try {
      const { data } = await this.supabase
        .from('blocked_ips')
        .select('ip_address')
        .eq('is_active', true);

      if (data) {
        data.forEach((row: any) => {
          this.blockedIPs.add(row.ip_address);
        });
        console.log(`🛡️ Loaded ${data.length} blocked IPs`);
      }
    } catch (error) {
      console.error('Failed to load blocked IPs:', error);
    }
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Export utilities for external use
export function createSecurityEventLogger() {
  return (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    securityMonitor.logEvent(event);
  };
}

export function createRequestAnalyzer() {
  return (req: NextRequest) => {
    return securityMonitor.analyzeRequest(req);
  };
}