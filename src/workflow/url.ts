export const STARTER_PARAM = 'starter';

export function getStarterParam(search: string): boolean {
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return (params.get(STARTER_PARAM) || '').toLowerCase() === 'on';
  } catch {
    return false;
  }
}

export const allowedStarterRoutes = [
  '/admin/studio',
  '/admin/studio/script',
  '/admin/studio/analysis',
  '/admin/studio/schedule',
  '/admin/studio/receipt',
  '/admin/viral-recipe-book',
];

export function applyStarterParam(url: string, on: boolean): string {
  try {
    const u = new URL(url, 'http://dummy.local');
    const isAllowed = allowedStarterRoutes.some(r => u.pathname.startsWith(r));
    if (!isAllowed) return url; // do not leak param to disallowed routes
    const params = u.searchParams;
    if (on) {
      params.set(STARTER_PARAM, 'on');
    } else {
      params.delete(STARTER_PARAM);
    }
    u.search = params.toString();
    return `${u.pathname}${u.search ? `?${u.search}` : ''}${u.hash || ''}`;
  } catch {
    return url;
  }
}


