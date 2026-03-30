import { NextRequest, NextResponse } from 'next/server'
import { source } from '@/lib/data'
import { computeViral } from '@/lib/vit/compute'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const v = await source.get(params.id)
    if (!v) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const viral = computeViral(v)
    return NextResponse.json({ ...v, viral })
  } catch (e:any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}


