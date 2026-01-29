"use client";
import { useEffect, useState } from 'react'

export default function PrivacyTab() {
  const [queue, setQueue] = useState<any[]>([])
  useEffect(() => { setQueue([]) }, [])
  return (
    <div>
      <div data-testid='dsar-queue'>Queue size: {queue.length}</div>
    </div>
  )
}


