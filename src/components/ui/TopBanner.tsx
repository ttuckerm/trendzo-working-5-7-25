'use client'

import React from 'react'

type Props = {}

export function TopBanner(_props: Props) {
  const [item, setItem] = React.useState<{ title: string; description?: string; variant?: 'success'|'error'|'info' }|null>(null)
  const [visible, setVisible] = React.useState(false)
  const timerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    const onEvt = (e: any) => {
      setItem({ title: e.detail?.title||'', description: e.detail?.description, variant: e.detail?.variant||'info' })
      setVisible(true)
      if (timerRef.current) window.clearTimeout(timerRef.current)
      const dur = Math.max(5000, Number(e.detail?.durationMs||0) || 5000)
      timerRef.current = window.setTimeout(()=> setVisible(false), dur)
    }
    window.addEventListener('app-banner' as any, onEvt)
    return () => window.removeEventListener('app-banner' as any, onEvt)
  }, [])

  if (!item || !visible) return null
  const color = item.variant==='success' ? 'bg-emerald-500 text-black' : item.variant==='error' ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'

  return (
    <div
      data-testid="top-banner"
      className={`fixed top-0 inset-x-0 z-50 mx-auto max-w-screen-2xl rounded-b-xl px-4 py-3 shadow-lg ${color} font-semibold flex items-center justify-between translate-y-0 animate-[slideDown_300ms_ease-out]`}
      role="status"
      aria-live="polite"
      style={{ willChange: 'transform' }}
    >
      <div className="truncate pr-4">{item.title}</div>
      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={()=> setVisible(false)}
        className="ml-4 text-sm opacity-80 hover:opacity-100"
      >
        ×
      </button>
      <style jsx global>{`
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0%); } }
        @keyframes slideUp { from { transform: translateY(0%); } to { transform: translateY(-100%); } }
      `}</style>
    </div>
  )
}



