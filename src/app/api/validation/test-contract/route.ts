import { NextRequest, NextResponse } from 'next/server';
import { createValidator } from '@/lib/validation/jsonSchema';
// Import schemas without $schema to avoid Ajv fetching meta-schema at build time
import ingestionSchemaRaw from '@/lib/schemas/video-ingestion-record.schema.json';
import presentationSchemaRaw from '@/lib/schemas/video-presentation-card.schema.json';

function stripMeta<T extends Record<string, any>>(schema: T): T {
  const { $schema, ...rest } = schema as any;
  return rest as T;
}

const ingestionSchema = stripMeta(ingestionSchemaRaw as any);
const presentationSchema = stripMeta(presentationSchemaRaw as any);

const validateIngestion = createValidator<any>(ingestionSchema as any);
const validatePresentation = createValidator<any>(presentationSchema as any);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const kind = body?.kind as 'ingestion' | 'presentation';
    const payload = body?.payload;

    if (!kind || !payload) {
      return NextResponse.json({ ok: false, errors: ['kind and payload are required'] }, { status: 400 });
    }

    const result = kind === 'ingestion' ? validateIngestion(payload) : validatePresentation(payload);
    return NextResponse.json({ ok: result.valid, errors: result.errors });
  } catch (e: any) {
    return NextResponse.json({ ok: false, errors: [e?.message || 'invalid request'] }, { status: 400 });
  }
}









