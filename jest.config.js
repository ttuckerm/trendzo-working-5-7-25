/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^server-only$': '<rootDir>/src/__tests__/__mocks__/server-only.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json', isolatedModules: true }]
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).ts',
    '**/__tests__/**/*.(test|spec).tsx'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setupJest.ts'],
}


