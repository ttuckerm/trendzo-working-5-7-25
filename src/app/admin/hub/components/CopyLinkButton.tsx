'use client'

import { useState, useCallback } from 'react'

interface CopyLinkButtonProps {
  text: string
}

export default function CopyLinkButton({ text }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200"
      style={{
        background: copied
          ? 'rgba(16,185,129,0.15)'
          : 'rgba(229,9,20,0.12)',
        color: copied ? '#10b981' : '#ff1744',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.25)' : 'rgba(229,9,20,0.2)'}`,
      }}
    >
      {copied ? (
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Copied!
        </span>
      ) : (
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy link
        </span>
      )}
    </button>
  )
}
