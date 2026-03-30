"use client"
import { useEffect, useRef, useState } from 'react'
import { eventBus } from '@/lib/services/serverEventBus'

const MAX_RECONNECT_ATTEMPTS = 3

export function useWebSocketClient(path: string = '/api/ws') {
  const [connected, setConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const attemptsRef = useRef(0)
  const timerRef = useRef<any>(null)
  const gaveUpRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const connect = () => {
      if (gaveUpRef.current) return
      if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        gaveUpRef.current = true
        console.warn(`[WebSocket] Gave up after ${MAX_RECONNECT_ATTEMPTS} failed attempts to ${path}`)
        return
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const url = `${protocol}//${window.location.host}${path}`
      const ws = new WebSocket(url)
      socketRef.current = ws
      ws.onopen = () => { setConnected(true); attemptsRef.current = 0; gaveUpRef.current = false }
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
        attemptsRef.current++
        if (attemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(30_000, Math.pow(2, attemptsRef.current) * 1000)
          timerRef.current = setTimeout(connect, delay)
        } else {
          gaveUpRef.current = true
        }
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


