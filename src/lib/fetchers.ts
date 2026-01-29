import { RecipeBookPayload, TemplateStatus, RecipeTemplate } from './types';

export async function getRecipeBook(params?: {
  status?: TemplateStatus;
  q?: string;
  sort?: 'success' | 'uses' | 'trend';
}): Promise<RecipeBookPayload> {
  const url = new URL('/api/recipe-book', typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  // These params are currently ignored by the API route but harmless to send
  if (params?.status) url.searchParams.set('status', params.status);
  if (params?.q) url.searchParams.set('q', params.q);
  if (params?.sort) url.searchParams.set('sort', params.sort);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch recipe book');
  const raw = await res.json();

  // If the payload is already in the expected shape, return it
  if (Array.isArray(raw?.templates) && typeof raw?.generatedAt === 'string') {
    return raw as RecipeBookPayload;
  }

  // Normalize the API response from the recipe-book service
  const hot = Array.isArray(raw?.hot) ? raw.hot : [];
  const cooling = Array.isArray(raw?.cooling) ? raw.cooling : [];
  const newly = Array.isArray(raw?.newly) ? raw.newly : [];
  const all = [...hot, ...cooling, ...newly];

  const thumbs = [
    '/thumbnails/template1.jpg',
    '/thumbnails/template2.jpg',
    '/thumbnails/template3.jpg',
    '/thumbnails/template4.jpg',
    '/thumbnails/template5.jpg',
    '/thumbnails/template6.jpg',
  ];
  const pickThumb = (i: number) => thumbs[i % thumbs.length] || '/thumbnails/placeholder-template.jpg';

  const templates: RecipeTemplate[] = all.map((t: any, i: number) => ({
    id: String(t?.id ?? `tpl_${i}`),
    name: String(t?.name ?? 'Template'),
    status: (t?.state as any) === 'HOT' || (t?.state as any) === 'COOLING' || (t?.state as any) === 'NEW' ? (t.state as any) : 'NEW',
    successRate: Math.round(((t?.successRate ?? 0) as number) * 100),
    uses: Number(t?.uses ?? 0),
    trendDelta7d: Number((t?.trendDelta7d ?? 0)),
    keyPatterns: Array.isArray(t?.keyPatterns) ? t.keyPatterns : [],
    exampleLinks: Array.isArray(t?.examples) ? t.examples : [],
    previewThumb: String(t?.previewThumb ?? pickThumb(i)),
  }));

  const generatedAt: string = String(raw?.generatedAtISO ?? new Date().toISOString());
  return { generatedAt, templates } as RecipeBookPayload;
}


