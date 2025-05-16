import { createClient } from '@supabase/supabase-js';

// Types for our diagnostic result
export interface DiagnosticResult {
  isValid: boolean;
  details: string;
  timestamp: string;
}

export interface SupabaseDiagnosticReport {
  environmentVariables: DiagnosticResult;
  networkConnectivity: DiagnosticResult;
  corsConfiguration: DiagnosticResult;
  authEndpoints: DiagnosticResult;
  dnsResolution: DiagnosticResult;
  firewallConfiguration: DiagnosticResult;
  clientLibrary: DiagnosticResult;
  summary: string;
  recommendedActions: string[];
  overallStatus: 'success' | 'warning' | 'error';
  rawResults: Record<string, any>;
}

/**
 * Diagnoses Supabase connection issues by performing a series of tests
 * @returns A comprehensive diagnostic report
 */
export async function diagnoseSupabaseConnection(): Promise<SupabaseDiagnosticReport> {
  const timestamp = new Date().toISOString();
  const report: SupabaseDiagnosticReport = {
    environmentVariables: { isValid: false, details: '', timestamp },
    networkConnectivity: { isValid: false, details: '', timestamp },
    corsConfiguration: { isValid: true, details: '', timestamp },
    authEndpoints: { isValid: false, details: '', timestamp },
    dnsResolution: { isValid: false, details: '', timestamp },
    firewallConfiguration: { isValid: true, details: '', timestamp },
    clientLibrary: { isValid: false, details: '', timestamp },
    summary: '',
    recommendedActions: [],
    overallStatus: 'error',
    rawResults: {}
  };

  // Step 1: Check environment variables
  const envCheckResult = checkEnvironmentVariables();
  report.environmentVariables = { ...envCheckResult, timestamp };
  report.rawResults.environmentVariables = envCheckResult.raw;

  // If environment variables are missing, we can't proceed with other checks
  if (!envCheckResult.isValid) {
    report.summary = 'Environment variables are not properly configured. Fix these issues before proceeding with other tests.';
    report.recommendedActions = [
      'Set NEXT_PUBLIC_SUPABASE_URL environment variable with your Supabase project URL',
      'Set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable with your Supabase anonymous key',
      'Verify environment variables are correctly loaded in both development and production environments'
    ];
    report.overallStatus = 'error';
    return report;
  }

  try {
    // Step 2: Test network connectivity
    const networkResult = await checkNetworkConnectivity(envCheckResult.raw.url);
    report.networkConnectivity = { ...networkResult, timestamp };
    report.rawResults.networkConnectivity = networkResult.raw;

    // Step 3: Test CORS configuration
    if (typeof window !== 'undefined') {
      const corsResult = await checkCorsConfiguration(envCheckResult.raw.url);
      report.corsConfiguration = { ...corsResult, timestamp };
      report.rawResults.corsConfiguration = corsResult.raw;
    } else {
      report.corsConfiguration = { 
        isValid: true, 
        details: 'CORS check skipped - running in server environment',
        timestamp 
      };
    }

    // Step 4: Test auth endpoints
    if (networkResult.isValid) {
      const authResult = await checkAuthEndpoints(
        envCheckResult.raw.url, 
        envCheckResult.raw.key
      );
      report.authEndpoints = { ...authResult, timestamp };
      report.rawResults.authEndpoints = authResult.raw;
    }

    // Step 5: Test client library initialization
    if (networkResult.isValid) {
      const clientResult = await checkClientLibrary(
        envCheckResult.raw.url, 
        envCheckResult.raw.key
      );
      report.clientLibrary = { ...clientResult, timestamp };
      report.rawResults.clientLibrary = clientResult.raw;
    }
  } catch (error: any) {
    // Handle DNS resolution issues
    if (error.message?.includes('getaddrinfo') || error.message?.includes('resolve host')) {
      report.dnsResolution = {
        isValid: false,
        details: `DNS resolution issue: ${error.message}`,
        timestamp
      };
    } 
    // Handle timeout issues which might indicate firewall blocking
    else if (error.message?.includes('timeout') || error.message?.includes('TIMEOUT')) {
      report.firewallConfiguration = {
        isValid: false,
        details: `Possible firewall issue: ${error.message}`,
        timestamp
      };
    }
    
    report.summary = `Connection error: ${error.message}`;
    report.recommendedActions.push('Check your network connectivity');
    report.recommendedActions.push('Verify your firewall settings allow connections to Supabase');
    report.overallStatus = 'error';
    
    console.error('Error during Supabase connection diagnostics:', error);
  }

  // Generate summary and recommendations based on results
  generateSummaryAndRecommendations(report);
  
  return report;
}

/**
 * Checks if required environment variables are set and valid
 */
function checkEnvironmentVariables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const issues: string[] = [];
  const result = { isValid: true, details: '', raw: { url: supabaseUrl || '', key: supabaseKey || '', urlValid: false, keyValid: false } };
  
  if (!supabaseUrl) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL is not set');
    result.isValid = false;
  } else if (!supabaseUrl.startsWith('https://')) {
    issues.push('NEXT_PUBLIC_SUPABASE_URL must start with https://');
    result.isValid = false;
  } else {
    result.raw.urlValid = true;
  }
  
  if (!supabaseKey) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    result.isValid = false;
  } else if (!supabaseKey.includes('.') || supabaseKey.length < 30) {
    issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid');
    result.isValid = false;
  } else {
    result.raw.keyValid = true;
  }
  
  if (issues.length > 0) {
    result.details = `Environment variable issues found: ${issues.join(', ')}`;
  } else {
    result.details = 'All required environment variables are correctly set';
  }
  
  return result;
}

/**
 * Checks basic network connectivity to Supabase
 */
async function checkNetworkConnectivity(url: string) {
  const result = { 
    isValid: false, 
    details: '', 
    raw: { 
      status: 0, 
      responseTime: 0,
      corsError: false 
    } 
  };
  
  try {
    // Simple network test with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const start = performance.now();
    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal 
    });
    const end = performance.now();
    clearTimeout(timeoutId);
    
    result.raw.status = response.status;
    result.raw.responseTime = Math.round(end - start);
    
    if (response.ok) {
      result.isValid = true;
      result.details = `Successfully connected to Supabase (${result.raw.responseTime}ms)`;
    } else {
      result.details = `Network connectivity failed with status: ${response.status} ${response.statusText}`;
    }
  } catch (error: any) {
    result.details = `Network connectivity failed: ${error.message}`;
    
    // Check for specific browser errors that might indicate CORS issues
    if (typeof window !== 'undefined' && 
        (error.message.includes('CORS') || 
         error.name === 'TypeError' && error.message === 'Failed to fetch')) {
      result.raw.corsError = true;
    }
  }
  
  return result;
}

/**
 * Specifically tests for CORS issues
 */
async function checkCorsConfiguration(url: string) {
  const result = { isValid: true, details: '', raw: {} };
  
  try {
    // CORS preflight test with explicit CORS mode
    const response = await fetch(url, { 
      method: 'OPTIONS',
      mode: 'cors',
      headers: { 
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    result.raw = { 
      status: response.status,
      corsHeadersPresent: !!response.headers.get('access-control-allow-origin')
    };
    
    if (response.ok && response.headers.get('access-control-allow-origin')) {
      result.details = 'CORS is properly configured';
    } else {
      result.isValid = false;
      result.details = 'CORS issue detected: Missing required CORS headers in response';
    }
  } catch (error: any) {
    result.isValid = false;
    result.details = `CORS issue detected: ${error.message}`;
  }
  
  return result;
}

/**
 * Tests connectivity to Supabase auth endpoints
 */
async function checkAuthEndpoints(url: string, key: string) {
  const result = { isValid: false, details: '', raw: { status: 0 } };
  
  try {
    // Try to access the auth API endpoint
    const authUrl = `${url}/auth/v1/`;
    const response = await fetch(authUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key
      }
    });
    
    result.raw.status = response.status;
    
    // Auth endpoints typically return 404 for undefined routes, but shouldn't return 401 or 403
    if (response.status !== 401 && response.status !== 403) {
      result.isValid = true;
      result.details = 'Auth endpoints are accessible';
    } else {
      result.details = `Auth endpoint returned status ${response.status}`;
    }
  } catch (error: any) {
    result.details = `Failed to connect to auth endpoints: ${error.message}`;
  }
  
  return result;
}

/**
 * Tests the supabase-js client library initialization
 */
async function checkClientLibrary(url: string, key: string) {
  const result = { isValid: false, details: '', raw: {} };
  
  try {
    // Try to initialize the client and perform a simple query
    const supabase = createClient(url, key);
    
    // Perform a simple query that shouldn't require special permissions
    const { data, error } = await supabase.from('_dummy_nonexistent_table').select('*').limit(1);
    
    // Even though the table doesn't exist, we should get a proper error response rather than a connection error
    if (error && error.code === '42P01') { // PostgreSQL error code for undefined_table
      result.isValid = true;
      result.details = 'Supabase client successfully initialized';
      result.raw = { errorCode: error.code, message: error.message };
    } else if (error) {
      result.raw = { error: error };
      result.details = `Client library issue: ${error.message}`;
    } else {
      result.isValid = true;
      result.details = 'Supabase client successfully initialized';
      result.raw = { data };
    }
  } catch (error: any) {
    result.details = `Failed to initialize Supabase client: ${error.message}`;
  }
  
  return result;
}

/**
 * Generates a summary and list of recommended actions based on the diagnostic results
 */
function generateSummaryAndRecommendations(report: SupabaseDiagnosticReport) {
  // Count failures
  const failures = [
    report.environmentVariables, 
    report.networkConnectivity,
    report.corsConfiguration,
    report.authEndpoints,
    report.dnsResolution,
    report.firewallConfiguration,
    report.clientLibrary
  ].filter(result => !result.isValid).length;
  
  // Summary based on number of failures
  if (failures === 0) {
    report.summary = 'All Supabase connection checks passed successfully';
    report.overallStatus = 'success';
  } else if (failures === 1) {
    report.summary = 'One issue detected with Supabase connection';
    report.overallStatus = 'warning';
  } else {
    report.summary = `Multiple issues detected (${failures}) with Supabase connection`;
    report.overallStatus = 'error';
  }
  
  // Generate recommendations based on specific failures
  if (!report.environmentVariables.isValid) {
    report.recommendedActions.push('Check your environment variables for correct Supabase URL and anon key');
  }
  
  if (!report.networkConnectivity.isValid) {
    report.recommendedActions.push('Verify network connectivity to Supabase servers');
    report.recommendedActions.push('Check if your ISP or network blocks outgoing connections to Supabase');
  }
  
  if (!report.corsConfiguration.isValid) {
    report.recommendedActions.push('Check CORS configuration in your Supabase project settings');
    report.recommendedActions.push('Add your app origin to the allowed origins in Supabase');
  }
  
  if (!report.authEndpoints.isValid) {
    report.recommendedActions.push('Verify your Supabase API key has the necessary permissions');
    report.recommendedActions.push('Check if Supabase authentication service is running properly');
  }
  
  if (!report.dnsResolution.isValid) {
    report.recommendedActions.push('Check your DNS configuration');
    report.recommendedActions.push('Try using a different DNS server');
  }
  
  if (!report.firewallConfiguration.isValid) {
    report.recommendedActions.push('Check if your firewall is blocking connections to Supabase');
    report.recommendedActions.push('Add Supabase domains to your firewall allowlist');
  }
  
  if (!report.clientLibrary.isValid) {
    report.recommendedActions.push('Verify you have the latest version of the Supabase client library');
    report.recommendedActions.push('Check for errors in your client initialization code');
  }
  
  // Deduplicate recommendations
  report.recommendedActions = [...new Set(report.recommendedActions)];
} 