import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getAdminDb, guardAdmin, withCache } from '../../_lib'

const Params = z.object({ id: z.string().min(1) })

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const denied = await guardAdmin(req)
  if (denied) return denied
  const db = getAdminDb()
  const { id } = Params.parse(params)
  const [mod, cfg] = await Promise.all([
    db.from('pipeline_modules').select('*').eq('id', id).limit(1),
    db.from('pipeline_module_config').select('*').eq('module_id', id).limit(1)
  ])
  return withCache({ module: (mod.data||[])[0] || null, config: (cfg.data||[])[0] || null }, 10)
}



