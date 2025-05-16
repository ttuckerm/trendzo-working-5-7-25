# Firebase Initialization Utilities

This module provides robust Firebase initialization functions for test and development environments. The utilities help ensure proper Firebase setup even when working in various testing scenarios.

## Features

- Reliable Firebase initialization with detailed error reporting
- Support for both real and mock Firebase configurations
- Automatic detection and reuse of existing Firebase app instances
- Debug mode for troubleshooting initialization issues
- Mock configuration option for testing without real credentials

## Usage

### Basic Firebase Initialization for Tests

```javascript
const { initializeTestFirebase } = require('./src/lib/utils/firebase-init');

// Basic initialization
const result = initializeTestFirebase();

if (result.success) {
  console.log('Firebase initialized successfully:', result.message);
  // Use result.app to access the Firebase app instance
} else {
  console.error('Firebase initialization failed:', result.error);
  // Check result.missingFields for specific missing configuration values
}
```

### Debugging Firebase Initialization

```javascript
const { initializeTestFirebase } = require('./src/lib/utils/firebase-init');

// Enable debug mode for detailed logging
const result = initializeTestFirebase({ debug: true });

// Debug output will show environment variable status and configuration details
```

### Using Mock Configuration for Tests

```javascript
const { initializeTestFirebaseWithMockConfig } = require('./src/lib/utils/firebase-init');

// Initialize with mock configuration (no real credentials needed)
const result = initializeTestFirebaseWithMockConfig();

// This always succeeds in isolation, suitable for unit tests
```

### Fallback Pattern for Scripts

```javascript
const { initializeTestFirebase, initializeTestFirebaseWithMockConfig } = require('./src/lib/utils/firebase-init');

// Try real config first, fall back to mock if unavailable
let firebaseSetup = initializeTestFirebase();

if (!firebaseSetup.success) {
  console.log('Real Firebase config not available, using mock configuration...');
  firebaseSetup = initializeTestFirebaseWithMockConfig();
}

// Continue with setup result
```

## Return Value Structure

The initialization functions return an object with the following properties:

```javascript
{
  success: true | false,     // Whether initialization succeeded
  app: FirebaseApp,          // The Firebase app instance (if success is true)
  message: String,           // Success message (if success is true)
  error: String,             // Error message (if success is false)
  missingFields: String[],   // List of missing configuration fields (if applicable)
  config: Object,            // Sanitized config used for initialization (if debug mode enabled)
  details: Error             // Original error object (if an exception occurred)
}
```

## Development Notes

- The `initializeTestFirebaseWithMockConfig()` function provides a consistent test environment without requiring real Firebase credentials.
- When using the mock configuration, Firebase operations that would normally interact with a real Firebase instance will not work unless properly mocked.
- For unit tests with Jest, you may need to mock Firebase operations that would normally interact with the Firebase backend. 