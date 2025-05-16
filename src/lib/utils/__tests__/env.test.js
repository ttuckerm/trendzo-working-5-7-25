import { getEnvVariable, getClientEnvVariable, getPublicEnvConfig } from '../env';

describe('Environment Variable Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { 
      ...originalEnv,
      // Simulate our actual environment based on .env.local
      NEXT_PUBLIC_FORCE_EDITOR: 'true',
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'trendzo-development-secret-key-0123456789',
      NODE_ENV: 'development',
      PORT: '3000',
      NEXT_PUBLIC_SUPABASE_URL: 'https://vyeiyccrageckeehyhj.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhb6ci...', // Shortened for security
      SUPABASE_SERVICE_ROLE_KEY: 'eyJhb6ci...', // Shortened for security
      NEXT_PUBLIC_USE_SUPABASE: 'true'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getEnvVariable', () => {
    it('returns the value of a server-side environment variable', () => {
      expect(getEnvVariable('NEXTAUTH_SECRET')).toBe('trendzo-development-secret-key-0123456789');
    });

    it('returns the value of a client-side environment variable', () => {
      expect(getEnvVariable('NEXT_PUBLIC_SUPABASE_URL')).toBe('https://vyeiyccrageckeehyhj.supabase.co');
    });

    it('returns default value when environment variable is not defined', () => {
      expect(getEnvVariable('NONEXISTENT_VAR', 'default')).toBe('default');
    });

    it('throws error when required variable is missing and no default provided', () => {
      expect(() => getEnvVariable('NONEXISTENT_VAR')).toThrow();
    });
  });

  describe('getClientEnvVariable', () => {
    it('returns the value of a client-side environment variable without prefix', () => {
      expect(getClientEnvVariable('SUPABASE_URL')).toBe('https://vyeiyccrageckeehyhj.supabase.co');
    });

    it('returns the value when prefix is already included', () => {
      expect(getClientEnvVariable('NEXT_PUBLIC_SUPABASE_URL')).toBe('https://vyeiyccrageckeehyhj.supabase.co');
    });

    it('returns default value when environment variable is not defined', () => {
      expect(getClientEnvVariable('NONEXISTENT_VAR', 'default')).toBe('default');
    });

    it('throws error when required client variable is missing', () => {
      expect(() => getClientEnvVariable('NONEXISTENT_VAR')).toThrow();
    });

    it('validates that variable is actually public', () => {
      expect(() => getClientEnvVariable('NEXTAUTH_SECRET')).toThrow(/must be prefixed with NEXT_PUBLIC_/);
    });
  });

  describe('getPublicEnvConfig', () => {
    it('returns an object with all public environment variables', () => {
      const config = getPublicEnvConfig();
      expect(config).toEqual({
        FORCE_EDITOR: 'true',
        BASE_URL: 'http://localhost:3000',
        SUPABASE_URL: 'https://vyeiyccrageckeehyhj.supabase.co',
        SUPABASE_ANON_KEY: 'eyJhb6ci...',
        USE_SUPABASE: 'true'
      });
    });

    it('includes specified private variables when explicitly allowed', () => {
      const config = getPublicEnvConfig(['PORT']);
      expect(config).toHaveProperty('PORT', '3000');
    });
  });
}); 