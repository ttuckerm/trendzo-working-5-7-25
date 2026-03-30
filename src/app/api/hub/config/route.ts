import { NextResponse } from 'next/server'

const HUB_CONFIG = {
  featured: [
    { id: 'freedom-os', title: 'Freedom OS', path: '/free/freedom-os', status: 'preview' as const },
    { id: 'credit', title: 'Credit Booster', path: '/free/credit', status: 'coming_soon' as const },
    { id: 'debt', title: 'Debt Escape Planner', path: '/free/debt', status: 'coming_soon' as const },
    { id: 'income', title: 'Income Stack Builder', path: '/free/income', status: 'coming_soon' as const },
  ],
  primaryCta: { title: 'Launch Freedom OS', path: '/free/freedom-os' },
}

export async function GET() {
  return NextResponse.json(HUB_CONFIG)
}
