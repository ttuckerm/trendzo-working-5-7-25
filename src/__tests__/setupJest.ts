// Optional DOM matchers if installed; guard require to avoid hard dependency
try { require('@testing-library/jest-dom/extend-expect'); } catch {}

// Fallback fetch for Node tests that don't mock it
if (!(global as any).fetch) {
  (global as any).fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) } as any));
}


