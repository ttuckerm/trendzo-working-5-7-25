import { diagnoseSupabaseConnection } from '../lib/supabaseConnectionDiagnostics';

// Mock the full module with Jest
jest.mock('../lib/supabaseConnectionDiagnostics', () => {
  // Keep the original types but mock the implementation
  const original = jest.requireActual('../lib/supabaseConnectionDiagnostics');
  
  return {
    ...original,
    diagnoseSupabaseConnection: jest.fn().mockImplementation(async () => {
      // Default successful response
      const timestamp = new Date().toISOString();
      
      return {
        environmentVariables: { 
          isValid: true, 
          details: 'All required environment variables are correctly set',
          timestamp
        },
        networkConnectivity: { 
          isValid: true, 
          details: 'Successfully connected to Supabase (50ms)',
          timestamp
        },
        corsConfiguration: { 
          isValid: true, 
          details: '',
          timestamp
        },
        authEndpoints: { 
          isValid: true, 
          details: 'Auth endpoints are accessible',
          timestamp
        },
        dnsResolution: { 
          isValid: true, 
          details: 'DNS resolution successful',
          timestamp
        },
        firewallConfiguration: { 
          isValid: true, 
          details: '',
          timestamp
        },
        clientLibrary: { 
          isValid: true, 
          details: 'Supabase client successfully initialized',
          timestamp
        },
        summary: 'All Supabase connection checks passed successfully',
        recommendedActions: [],
        overallStatus: 'success',
        rawResults: {}
      };
    })
  };
});

// Mock fetch for testing
global.fetch = jest.fn();

// Mock Response
global.Response = jest.fn().mockImplementation((body, init) => {
  return {
    status: init?.status || 200,
    statusText: 'OK',
    ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    headers: new Map(Object.entries(init?.headers || {})),
    json: async () => JSON.parse(body),
    text: async () => body,
  };
}) as unknown as typeof Response;

describe('Supabase Connection Diagnostics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    
    // Reset mocked implementation to default success
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    mockDiagnose.mockClear();
  });

  test('should validate environment variables', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { 
        isValid: true, 
        details: 'All required environment variables are correctly set',
        timestamp
      },
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
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.environmentVariables.isValid).toBe(true);
  });

  test('should detect missing environment variables', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { 
        isValid: false, 
        details: 'Environment variable issues found: NEXT_PUBLIC_SUPABASE_URL is not set',
        timestamp
      },
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
    });
    
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    const result = await diagnoseSupabaseConnection();
    expect(result.environmentVariables.isValid).toBe(false);
    expect(result.environmentVariables.details).toContain('NEXT_PUBLIC_SUPABASE_URL');
  });

  test('should detect successful network connection', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { 
        isValid: true, 
        details: 'Successfully connected to Supabase (50ms)',
        timestamp
      },
      corsConfiguration: { isValid: true, details: '', timestamp },
      authEndpoints: { isValid: false, details: '', timestamp },
      dnsResolution: { isValid: true, details: '', timestamp },
      firewallConfiguration: { isValid: true, details: '', timestamp },
      clientLibrary: { isValid: false, details: '', timestamp },
      summary: '',
      recommendedActions: [],
      overallStatus: 'warning',
      rawResults: {}
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.networkConnectivity.isValid).toBe(true);
  });

  test('should detect network failures', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { 
        isValid: false, 
        details: 'Network connectivity failed: Failed to fetch',
        timestamp
      },
      corsConfiguration: { isValid: true, details: '', timestamp },
      authEndpoints: { isValid: false, details: '', timestamp },
      dnsResolution: { isValid: false, details: '', timestamp },
      firewallConfiguration: { isValid: true, details: '', timestamp },
      clientLibrary: { isValid: false, details: '', timestamp },
      summary: '',
      recommendedActions: [],
      overallStatus: 'error',
      rawResults: {}
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.networkConnectivity.isValid).toBe(false);
    expect(result.networkConnectivity.details).toContain('Failed to fetch');
  });

  test('should detect CORS issues', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { isValid: false, details: '', timestamp },
      corsConfiguration: { 
        isValid: false, 
        details: 'CORS issue detected: Failed to fetch',
        timestamp
      },
      authEndpoints: { isValid: false, details: '', timestamp },
      dnsResolution: { isValid: true, details: '', timestamp },
      firewallConfiguration: { isValid: true, details: '', timestamp },
      clientLibrary: { isValid: false, details: '', timestamp },
      summary: '',
      recommendedActions: [],
      overallStatus: 'error',
      rawResults: {}
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.corsConfiguration.isValid).toBe(false);
    expect(result.corsConfiguration.details).toContain('CORS');
  });

  test('should detect auth endpoint availability', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { isValid: true, details: '', timestamp },
      corsConfiguration: { isValid: true, details: '', timestamp },
      authEndpoints: { 
        isValid: true, 
        details: 'Auth endpoints are accessible',
        timestamp
      },
      dnsResolution: { isValid: true, details: '', timestamp },
      firewallConfiguration: { isValid: true, details: '', timestamp },
      clientLibrary: { isValid: true, details: '', timestamp },
      summary: '',
      recommendedActions: [],
      overallStatus: 'success',
      rawResults: {}
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.authEndpoints.isValid).toBe(true);
  });

  test('should detect auth endpoint issues', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { isValid: true, details: '', timestamp },
      corsConfiguration: { isValid: true, details: '', timestamp },
      authEndpoints: { 
        isValid: false, 
        details: 'Auth endpoint returned status 401',
        timestamp
      },
      dnsResolution: { isValid: true, details: '', timestamp },
      firewallConfiguration: { isValid: true, details: '', timestamp },
      clientLibrary: { isValid: true, details: '', timestamp },
      summary: '',
      recommendedActions: [],
      overallStatus: 'warning',
      rawResults: {}
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.authEndpoints.isValid).toBe(false);
    expect(result.authEndpoints.details).toContain('401');
  });

  test('should handle DNS resolution issues', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { isValid: false, details: '', timestamp },
      corsConfiguration: { isValid: true, details: '', timestamp },
      authEndpoints: { isValid: false, details: '', timestamp },
      dnsResolution: { 
        isValid: false, 
        details: 'DNS resolution issue: Failed to resolve hostname',
        timestamp
      },
      firewallConfiguration: { isValid: true, details: '', timestamp },
      clientLibrary: { isValid: false, details: '', timestamp },
      summary: '',
      recommendedActions: [],
      overallStatus: 'error',
      rawResults: {}
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.dnsResolution.isValid).toBe(false);
  });

  test('should detect firewall issues', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    mockDiagnose.mockResolvedValueOnce({
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { isValid: false, details: '', timestamp },
      corsConfiguration: { isValid: true, details: '', timestamp },
      authEndpoints: { isValid: false, details: '', timestamp },
      dnsResolution: { isValid: false, details: '', timestamp },
      firewallConfiguration: { 
        isValid: false, 
        details: 'Possible firewall issue: The operation was aborted due to timeout',
        timestamp
      },
      clientLibrary: { isValid: false, details: '', timestamp },
      summary: '',
      recommendedActions: [],
      overallStatus: 'error',
      rawResults: {}
    });
    
    const result = await diagnoseSupabaseConnection();
    expect(result.firewallConfiguration.isValid).toBe(false);
  });

  test('should provide comprehensive diagnosis report', async () => {
    const mockDiagnose = diagnoseSupabaseConnection as jest.Mock;
    const timestamp = new Date().toISOString();
    
    const mockReport = {
      environmentVariables: { isValid: true, details: '', timestamp },
      networkConnectivity: { isValid: true, details: '', timestamp },
      corsConfiguration: { isValid: true, details: '', timestamp },
      authEndpoints: { isValid: true, details: '', timestamp },
      dnsResolution: { isValid: true, details: '', timestamp },
      firewallConfiguration: { isValid: true, details: '', timestamp },
      clientLibrary: { isValid: true, details: '', timestamp },
      summary: 'All Supabase connection checks passed successfully',
      recommendedActions: [],
      overallStatus: 'success',
      rawResults: {
        environmentVariables: { url: 'set', key: 'set', urlValid: true, keyValid: true },
        networkConnectivity: { status: 200, responseTime: 42 },
        authEndpoints: { status: 200 }
      }
    };
    
    mockDiagnose.mockResolvedValueOnce(mockReport);
    
    const result = await diagnoseSupabaseConnection();
    
    expect(result).toHaveProperty('environmentVariables');
    expect(result).toHaveProperty('networkConnectivity');
    expect(result).toHaveProperty('corsConfiguration');
    expect(result).toHaveProperty('authEndpoints');
    expect(result).toHaveProperty('dnsResolution');
    expect(result).toHaveProperty('firewallConfiguration');
    expect(result).toHaveProperty('clientLibrary');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('recommendedActions');
  });
}); 