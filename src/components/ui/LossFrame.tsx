'use client'

export function LossFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4 py-3"
      style={{
        borderLeft: '3px solid #e63946',
        color: '#a0a0a0',
        fontFamily: "'DM Sans', sans-serif",
        fontStyle: 'italic',
        fontSize: '14px',
        lineHeight: '1.6',
      }}
    >
      {children}
    </div>
  )
}
