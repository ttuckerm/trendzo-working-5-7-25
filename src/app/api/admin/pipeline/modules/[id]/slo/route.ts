import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb, guardAdmin, parseRange, withCache } from '../../../_lib'
import { computeSloForModule, DEFAULT_THRESHOLDS } from '../../../_slo'

const Params = z.object({ id: z.string().min(1) })

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  const db = getAdminDb()
  const range = parseRange(req)
  const { id } = Params.parse(params)
  const slo = await computeSloForModule(db, id, range)
  return withCache({
    ...slo,
    thresholds: DEFAULT_THRESHOLDS,
  }, 10)
}



