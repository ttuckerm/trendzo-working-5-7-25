/**
 * Failing test documenting a build-time import bug.
 * Expectation: API route modules must not import server-only deps at module scope.
 * Current behavior: Importing the Apify route triggers apify-client import at module load.
 */

// Simulate Next.js build evaluating route module without Node-only deps preloaded
jest.mock('apify-client', () => {
  throw new Error('apify-client imported at module load');
}, { virtual: true });

describe('apify-scrapers route module import', () => {
  test('does not import apify-client at module scope (should FAIL today)', async () => {
    // Intentionally expect no throw to encode desired behavior. This will fail now.
    let threw = false;
    try {
      // Import the route module; this should NOT evaluate apify-client at module scope
      await import('@/app/api/admin/apify-scrapers/route');
    } catch (err) {
      threw = true;
    }

    // Desired: threw === false. Current bug: threw === true.
    expect(threw).toBe(false);
  });
});






































































































