// Mock implementation of firebase-admin for development
// In a real project, use the actual firebase-admin package

export function initializeApp(options: any) {
  console.log('Mock Firebase Admin initialized with options:', options);
  return {
    name: options.projectId || 'mock-app',
    options: options
  };
}

export function getApps() {
  return [];
}

export function cert(credentials: any) {
  return credentials;
}

// Mock authentication for development
export async function mockVerifyToken(token: string) {
  // For development purposes, token might be in format 'user_123'
  if (token.startsWith('user_')) {
    return {
      uid: token,
      email: `${token}@example.com`,
      email_verified: true
    };
  }
  
  throw new Error('Invalid mock token');
} 