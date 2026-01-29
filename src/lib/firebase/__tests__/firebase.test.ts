// FILE: src/lib/firebase/__tests__/firebase.test.ts

// Import the items to be tested from the version of firebase.ts
// that WILL BE MODIFIED to disable Firebase.
import {
  app,
  auth,
  db,
  storage,
  analytics,
  crashlytics as exportedCrashlytics, // Renamed to avoid conflict with describe block
  remoteConfig,
  setCrashlyticsUserId,
  refreshRemoteConfig
} from '../firebase'; // Adjust path as necessary

describe('Firebase Module after Disabling Firebase Initialization', () => {

  test('Firebase "app" instance should be null', () => {
    expect(app).toBeNull();
  });

  test('Firebase "auth" instance should be null', () => {
    expect(auth).toBeNull();
  });

  test('Firebase "db" (Firestore) instance should be null', () => {
    expect(db).toBeNull();
  });

  test('Firebase "storage" instance should be null', () => {
    expect(storage).toBeNull();
  });

  test('Firebase "analytics" instance should be null', () => {
    expect(analytics).toBeNull();
  });

  test('Exported "crashlytics" instance should be null', () => {
    expect(exportedCrashlytics).toBeNull();
  });

  test('Firebase "remoteConfig" instance should be null', () => {
    expect(remoteConfig).toBeNull();
  });

  describe('Helper Functions after Disabling Firebase', () => {
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      // Spy on console.warn before each test in this describe block
      // This assumes a Jest-like environment. If not Jest, this needs adjustment.
      // @ts-ignore
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore the original console.warn after each test
      // @ts-ignore
      consoleWarnSpy.mockRestore();
    });

    test('setCrashlyticsUserId should not throw an error and should call console.warn', () => {
      expect(() => setCrashlyticsUserId('test-user-id')).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('setCrashlyticsUserId called, but Crashlytics is disabled. UserID:'),
        'test-user-id'
      );
    });

    test('refreshRemoteConfig should not throw an error, return a promise that resolves, and should call console.warn', async () => {
      await expect(refreshRemoteConfig()).resolves.toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('refreshRemoteConfig called, but Remote Config is disabled')
      );
    });
  });
}); 