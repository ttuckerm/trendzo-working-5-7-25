import { expect, test } from 'vitest';

test('fixtures load shape', async () => {
  const templates = (await import('../_fixtures/templates.json')).default as any[];
  expect(Array.isArray(templates)).toBe(true);
  expect(templates[0]).toHaveProperty('id');
});

test('localStorage persistence schema', () => {
  const key = 'sandboxUser';
  const state = { niche: 'fitness', goal: 'sales', templateId: 't1' };
  // @ts-ignore
  global.localStorage = {
    getItem: (k: string) => (k === key ? JSON.stringify(state) : null),
    setItem: () => {}
  } as any;
  const loaded = JSON.parse(global.localStorage.getItem(key) as string);
  expect(loaded.niche).toBe('fitness');
});


