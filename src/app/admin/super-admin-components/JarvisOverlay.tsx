"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, X, AlertCircle } from 'lucide-react'

interface Message {
  id: string
  text: string
  type: 'user' | 'jarvis'
  timestamp: Date
}

type MicStatus = 'ok' | 'blocked' | 'off'

export default function JarvisOverlay() {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<any>({ overlay_enabled: true, pending_confirms: [], skills_registered: 0, ws_mode: 'event_bus' })
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [micStatus, setMicStatus] = useState<MicStatus>('ok')
  const [showMicBanner, setShowMicBanner] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handlerRef = useRef<(e: KeyboardEvent)=>void>()
  const inputRef = useRef<HTMLInputElement>(null)
  // Check microphone permissions and status
  const checkMicStatus = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setMicStatus('off')
        return
      }

      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop()) // Clean up
      setMicStatus('ok')
      setShowMicBanner(false)
    } catch (error: any) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicStatus('blocked')
        setShowMicBanner(true)
      } else {
        setMicStatus('off')
      }
    }
  }

  // Text-to-speech function
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // Smoke test function for Jarvis
  const runJarvisSmokeTest = async () => {
    console.info('=== JARVIS SMOKE TEST START ===')
    const testPhrases = [
      "Jarvis, today's idea is reduce early-view decay by 10% for EDU.",
      "Jarvis, research today's idea.",
      "Jarvis, what was my idea on 2025-09-25?",
      "Jarvis, show my idea log for this week."
    ]
    
    for (const phrase of testPhrases) {
      console.info(`\n🧪 Testing phrase: "${phrase}"`)
      try {
        const response = await fetch('/api/jarvis/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            utterance: phrase, 
            mode: 'test', 
            actor: { id: 'smoke_test', role: 'super_admin' } 
          })
        })
        const result = await response.json()
        console.info(`✓ Skill: ${result.skillId || 'unknown'}`)
        console.info(`✓ Response: ${(result.text || 'No response').slice(0, 200)}`)
      } catch (error) {
        console.error(`✗ Error testing phrase: ${error}`)
      }
    }
    console.info('\n=== JARVIS SMOKE TEST END ===')
  }

  // Keyboard shortcut listener (stable, no polling)
  useEffect(() => {
    ;(window as any).runJarvisSmokeTest = runJarvisSmokeTest

    handlerRef.current = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        if (!visible) {
          setVisible(true)
          setTimeout(() => { inputRef.current?.focus() }, 100)
        } else {
          setVisible(false)
        }
      }
    }

    window.addEventListener('keydown', handlerRef.current)
    return () => {
      if (handlerRef.current) window.removeEventListener('keydown', handlerRef.current)
    }
  }, [visible])

  // Only poll Jarvis status when overlay is visible
  useEffect(() => {
    if (!visible) return

    const h = async () => {
      try {
        const r = await fetch('/api/admin/jarvis/status', { cache: 'no-store' })
        const j = await r.json()
        setStatus(j)
      } catch {}
    }

    h()
    checkMicStatus()
    const interval = setInterval(h, 10000)
    return () => clearInterval(interval)
  }, [visible])

  const pending = useMemo(()=>status?.pending_confirms || [], [status])

  const submit = async () => {
    if (!input.trim() || isSubmitting) return
    
    setIsSubmitting(true)
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input.trim(),
      type: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim()
    setInput('')
    
    // Console log for diagnosis
    console.info('[Jarvis] text command:', currentInput)
    
    try {
      const rq = await fetch('/api/jarvis/intent', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          utterance: currentInput, 
          mode: 'text', 
          actor: { id: 'overlay', role: 'super_admin' } 
        }) 
      })
      const res = await rq.json()
      
      // Console logs for diagnosis
      console.info('[Jarvis] skill selected:', res.skillId || 'unknown')
      console.info('[Jarvis] response:', res.text.slice(0, 120))
      
      const jarvisMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: res.text,
        type: 'jarvis',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, jarvisMessage])
      
      // Speak the response
      speakText(res.text)
      
      // Refresh status
      try { 
        const r = await fetch('/api/admin/jarvis/status', { cache: 'no-store' })
        const j = await r.json()
        setStatus(j) 
      } catch {}
      
    } catch (error) {
      console.error('[Jarvis] Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: 'Sorry, I encountered an error processing that command.',
        type: 'jarvis',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  if (!visible) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 720, background: '#0b0b0b', border: '1px solid #333', borderRadius: 12, color: 'white', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
        
        {/* Microphone Permission Banner */}
        {showMicBanner && micStatus === 'blocked' && (
          <div style={{ 
            background: '#fbbf24', 
            color: '#000', 
            padding: 12, 
            borderRadius: '12px 12px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            fontSize: 14
          }}>
            <AlertCircle size={16} />
            <div style={{ flex: 1 }}>
              Microphone permission is blocked. Click the camera icon in the browser bar and allow microphone for this site.
            </div>
            <button 
              onClick={checkMicStatus}
              style={{ 
                padding: '4px 8px', 
                background: '#000', 
                color: '#fbbf24', 
                border: 0, 
                borderRadius: 4, 
                fontSize: 12 
              }}
            >
              Test mic
            </button>
            <button 
              onClick={() => setShowMicBanner(false)}
              style={{ 
                padding: '4px', 
                background: 'transparent', 
                color: '#000', 
                border: 0, 
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{ padding: 16, paddingBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              Jarvis
              {micStatus === 'ok' && <Mic size={16} style={{ color: '#22c55e' }} />}
              {micStatus === 'blocked' && <Mic size={16} style={{ color: '#ef4444' }} />}
              {micStatus === 'off' && <Mic size={16} style={{ color: '#6b7280' }} />}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Ctrl+J to close | Enter to send</div>
          </div>
        </div>

        {/* Message History */}
        {messages.length > 0 && (
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '0 16px', 
            maxHeight: '300px',
            marginTop: 12
          }}>
            {messages.map(message => (
              <div key={message.id} style={{ 
                marginBottom: 12,
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '8px 12px',
                  borderRadius: 12,
                  background: message.type === 'user' ? '#0ea5e9' : '#333',
                  color: 'white',
                  fontSize: 14,
                  wordWrap: 'break-word'
                }}>
                  {message.text}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input 
              ref={inputRef}
              value={input} 
              onChange={e=>setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type to Jarvis… (Enter to send)" 
              disabled={isSubmitting}
              style={{ 
                flex: 1, 
                padding: 10, 
                background: '#111', 
                color: 'white', 
                border: '1px solid #444', 
                borderRadius: 8,
                opacity: isSubmitting ? 0.6 : 1
              }} 
            />
            <button 
              onClick={submit} 
              disabled={isSubmitting || !input.trim()}
              style={{ 
                padding: '10px 14px', 
                background: isSubmitting || !input.trim() ? '#666' : '#0ea5e9', 
                color: 'white', 
                border: 0, 
                borderRadius: 8,
                cursor: isSubmitting || !input.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? '...' : 'Send'}
            </button>
          </div>
          
          {/* Status Bar */}
          <div style={{ fontSize: 12, display: 'flex', gap: 16, opacity: 0.7 }}>
            <div>Skills: {status.skills_registered}</div>
            <div>Pending confirms: {pending.length}</div>
            <div>WS: {status.ws_mode}</div>
            <div>Mic: {micStatus}</div>
          </div>
        </div>

        {/* Confirmation Section */}
        {pending.length > 0 && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ fontSize: 12, marginBottom: 8, opacity: 0.8 }}>Confirmations:</div>
            {pending.map((p: any) => (
              <div key={p.confirmationId} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, background: '#111', border: '1px solid #333', borderRadius: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>{p.skillId} — expires {Math.round((p.expiresAt - Date.now())/1000)}s</div>
                <button onClick={async()=> { await fetch('/api/jarvis/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationId: p.confirmationId, response: 'confirm' }) }); const r=await fetch('/api/admin/jarvis/status'); setStatus(await r.json()) }} style={{ padding: '6px 10px', background: '#22c55e', color: 'white', border: 0, borderRadius: 6 }}>Confirm</button>
                <button onClick={async()=> { await fetch('/api/jarvis/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmationId: p.confirmationId, response: 'cancel' }) }); const r=await fetch('/api/admin/jarvis/status'); setStatus(await r.json()) }} style={{ padding: '6px 10px', background: '#ef4444', color: 'white', border: 0, borderRadius: 6 }}>Cancel</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


