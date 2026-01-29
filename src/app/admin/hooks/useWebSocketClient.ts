"use client"
import { useEffect, useRef, useState } from 'react'
import { eventBus } from '@/lib/services/serverEventBus'

export function useWebSocketClient(path: string = '/api/ws') {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const attemptsRef = useRef(0)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${protocol}//${window.location.host}${path}`
      const ws = new WebSocket(url)
      socketRef.current = ws
      ws.onopen = () => { setConnected(true); attemptsRef.current = 0 }
      ws.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data)
          setLastMessage(parsed)
          if (parsed?.channel) {
            eventBus.publish(parsed.channel, parsed.payload)
          }
        } catch {
          setLastMessage({ type: 'raw', data: ev.data })
        }
      }
      ws.onclose = () => {
        setConnected(false)
        const delay = Math.min(30_000, Math.pow(2, attemptsRef.current++) * 1000)
        timerRef.current = setTimeout(connect, delay)
      }
      ws.onerror = () => { try { ws.close() } catch {} }
    }
    connect()
    return () => { if (timerRef.current) clearTimeout(timerRef.current); socketRef.current?.close() }
  }, [path])

  const send = (json: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(json))
    }
  }

  return { connected, lastMessage, send }
}


