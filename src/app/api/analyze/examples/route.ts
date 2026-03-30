import { NextResponse } from 'next/server'

export async function GET() {
  if (process.env.MOCK !== '1') return NextResponse.json({ error: 'examples_only_in_mock' }, { status: 404 })
  const examples = [
    {
      title: 'Draft A – Slow pacing, no CTA',
      platform: 'tiktok',
      niche: 'fitness',
      scriptText: 'What if you could burn fat faster? In this video I will show... then we will... finally...',
      caption: 'How to burn fat faster with 3 science-backed tips',
      durationSec: 28
    },
    {
      title: 'Draft B – Strong hook, medium pace',
      platform: 'instagram',
      niche: 'skincare',
      scriptText: 'Stop scrolling. You are probably wasting money on cleansers. Here’s why and what to do instead...',
      caption: 'Skincare routine that actually works (derm-approved)',
      durationSec: 34
    },
    {
      title: 'Draft C – Fast pace, explicit CTA',
      platform: 'youtube',
      niche: 'productivity',
      scriptText: 'You won’t believe what this 2-minute system does to your focus. Do this: first, write this down... save this for later.',
      caption: 'Focus hack you can try today',
      durationSec: 38
    }
  ]
  return NextResponse.json({ examples })
}


