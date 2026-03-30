import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Docker Health Check API Endpoint
 * Provides comprehensive system health monitoring for container orchestration
 */

// unified GET only once; remove duplicate definitions

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: 'pass' | 'fail';
    memory: 'pass' | 'fail' | 'warning';
    disk: 'pass' | 'fail' | 'warning';
    external_apis: 'pass' | 'fail' | 'warning';
  };
  details?: any;
}

const startTime = Date.now();

export async function GET(request: NextRequest): Promise<NextResponse> {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: 'pass',
      memory: 'pass',
      disk: 'pass',
      external_apis: 'pass'
    }
  };

  let overallHealthy = true;
  const details: any = {};

  try {
    // 1. Database Health Check
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );
        
        const startDb = Date.now();
        const { error } = await supabase.from('viral_predictions').select('id').limit(1);
        const dbLatency = Date.now() - startDb;
        
        if (error) {
          healthStatus.checks.database = 'fail';
          overallHealthy = false;
          details.database_error = error.message;
        } else {
          details.database_latency_ms = dbLatency;
          if (dbLatency > 1000) {
            healthStatus.checks.database = 'fail';
            overallHealthy = false;
          }
        }
      } else {
        healthStatus.checks.database = 'fail';
        overallHealthy = false;
        details.database_error = 'Database credentials not configured';
      }
    } catch (dbError: any) {
      healthStatus.checks.database = 'fail';
      overallHealthy = false;
      details.database_error = dbError.message;
    }

    // 2. Memory Health Check
    try {
      const memUsage = process.memoryUsage();
      const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      
      details.memory = {
        used_mb: memUsedMB,
        total_mb: memTotalMB,
        usage_percent: Math.round((memUsedMB / memTotalMB) * 100)
      };

      if (memUsedMB > 1024) { // > 1GB
        healthStatus.checks.memory = 'warning';
        if (memUsedMB > 2048) { // > 2GB
          healthStatus.checks.memory = 'fail';
          overallHealthy = false;
        }
      }
    } catch (memError: any) {
      healthStatus.checks.memory = 'fail';
      details.memory_error = memError.message;
    }

    // 3. Disk Space Check (basic)
    try {
      const stats = await import('fs').then(fs => fs.promises.stat('.'));
      details.disk = {
        available: true,
        last_check: new Date().toISOString()
      };
    } catch (diskError: any) {
      healthStatus.checks.disk = 'fail';
      details.disk_error = diskError.message;
    }

    // 4. External APIs Health Check (sample key APIs)
    try {
      const apiChecks = [];
      
      // Check if critical environment variables are present
      if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        apiChecks.push('Missing AI API keys');
      }
      
      if (!process.env.APIFY_API_TOKEN) {
        apiChecks.push('Missing Apify API token');
      }

      if (apiChecks.length > 0) {
        healthStatus.checks.external_apis = 'warning';
        details.external_api_warnings = apiChecks;
      }

      details.external_apis = {
        openai_configured: !!process.env.OPENAI_API_KEY,
        anthropic_configured: !!process.env.ANTHROPIC_API_KEY,
        apify_configured: !!process.env.APIFY_API_TOKEN,
        supabase_configured: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
      };
    } catch (apiError: any) {
      healthStatus.checks.external_apis = 'fail';
      details.external_api_error = apiError.message;
    }

    // Determine overall status
    if (!overallHealthy) {
      healthStatus.status = 'unhealthy';
    } else if (
      healthStatus.checks.memory === 'warning' || 
      healthStatus.checks.external_apis === 'warning'
    ) {
      healthStatus.status = 'degraded';
    }

    healthStatus.details = details;

    // Return appropriate HTTP status
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthStatus, { status: httpStatus });

  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      error: 'Health check failed',
      details: error.message
    }, { status: 503 });
  }
}

// Also support HEAD requests for basic connectivity checks
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}