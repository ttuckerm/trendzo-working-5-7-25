'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { buildInputFromForm, type FormState } from '@/lib/assessment/build-input-from-form'
import { FreedomMultiplierControl } from '@/components/freedom-os/FreedomMultiplierControl'
import { HamsterLoader } from '@/components/freedom-os/HamsterLoader'

const STORAGE_KEY = 'dl:freedom-os:v1:state'

const DEFAULT_FORM: FormState = {
  firstName: '',
  hoursPerWeek: '',
  monthlyIncome: '',
  monthlyExpenses: '',
  runwayMonths: '',
  skillProfile: '',
  riskTolerance: '',
  audienceAccess: '',
  nicheSignal: '',
}

const EXAMPLE_FORM: FormState = {
  firstName: 'Sarah',
  hoursPerWeek: 12,
  monthlyIncome: 4500,
  monthlyExpenses: 3200,
  runwayMonths: 2.5,
  skillProfile: '10 years in marketing, mid-level, comfortable with copywriting and email.',
  riskTolerance: 'medium',
  audienceAccess: '5,000 LinkedIn followers in B2B SaaS',
  nicheSignal: 'Newsletter for early-stage SaaS founders',
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.85)',
}

const selectOptionStyle = { color: '#111827', backgroundColor: '#ffffff' }

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: 'rgba(255,255,255,0.35)' }}
    >
      {children}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-[11px] mt-1" style={{ color: '#fca5a5' }}>
      {message}
    </p>
  )
}

type RunwayMode = 'months' | 'amount'

export interface FreedomOSToolProps {
  // When the user arrived through the paid Stripe path, this is the
  // checkout session id. The generator route uses it to mark the purchase
  // consumed and link it to the new assessment. Null for the code path.
  sessionId?: string | null
}

export default function FreedomOSTool({ sessionId = null }: FreedomOSToolProps = {}) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [runwayMode, setRunwayMode] = useState<RunwayMode>('months')
  const [savingsAmount, setSavingsAmount] = useState<number | string>('')
  const [freedomMultiplier, setFreedomMultiplier] = useState(1.5)
  const [hydrated, setHydrated] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Restore from localStorage on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.form) setForm((prev: FormState) => ({ ...prev, ...parsed.form }))
        if (typeof parsed.runwayMode === 'string') setRunwayMode(parsed.runwayMode)
        if (parsed.savingsAmount != null) setSavingsAmount(parsed.savingsAmount)
        if (typeof parsed.freedomMultiplier === 'number') setFreedomMultiplier(parsed.freedomMultiplier)
      }
    } catch { /* ignore corrupt cache */ }
    setHydrated(true)
  }, [])

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ form, runwayMode, savingsAmount, freedomMultiplier }),
      )
    } catch { /* quota exceeded — ignore */ }
  }, [form, runwayMode, savingsAmount, freedomMultiplier, hydrated])

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setSubmitError(null)
  }, [])

  const handleLoadExample = useCallback(() => {
    setForm(EXAMPLE_FORM)
    setRunwayMode('months')
    setSavingsAmount('')
    setFreedomMultiplier(1.5)
    setErrors({})
    setSubmitError(null)
  }, [])

  const handleReset = useCallback(() => {
    setForm(DEFAULT_FORM)
    setRunwayMode('months')
    setSavingsAmount('')
    setFreedomMultiplier(1.5)
    setErrors({})
    setSubmitError(null)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  const submit = useCallback(async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    setErrors({})

    // If the user is in dollars-mode for runway, convert to months before
    // validating. monthlyExpenses must be > 0 for the conversion to make
    // sense; if it isn't, we surface that as an expense error.
    let runwayForForm: number | string = form.runwayMonths
    if (runwayMode === 'amount') {
      const expensesNum = Number(String(form.monthlyExpenses).replace(/[\s$,]/g, ''))
      const savingsNum = Number(String(savingsAmount).replace(/[\s$,]/g, ''))
      if (!Number.isFinite(expensesNum) || expensesNum <= 0) {
        setErrors({ monthlyExpenses: 'Enter monthly expenses to compute runway from a dollar amount.' })
        setIsSubmitting(false)
        return
      }
      if (!Number.isFinite(savingsNum) || savingsNum < 0) {
        setErrors({ runwayMonths: 'Enter a savings amount in dollars (0 or higher).' })
        setIsSubmitting(false)
        return
      }
      runwayForForm = Math.round((savingsNum / expensesNum) * 10) / 10
    }

    const result = buildInputFromForm(
      { ...form, runwayMonths: runwayForForm },
      freedomMultiplier,
    )
    if (!result.ok) {
      setErrors(result.errors)
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/assessment/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionId ? { ...result.input, sessionId } : result.input),
      })

      let data: {
        ok?: boolean
        assessmentId?: string
        shareUrlId?: string
        shareToken?: string | null
        error?: string
      } = {}
      try { data = await res.json() } catch { /* parse error handled below */ }

      if (!res.ok || !data.ok || typeof data.assessmentId !== 'string') {
        if (res.status === 503) {
          setSubmitError('The assessment system is temporarily unavailable. Please try again in a moment.')
        } else if (res.status === 400) {
          setSubmitError(
            typeof data.error === 'string' && data.error
              ? data.error
              : 'Something looked off with your inputs. Please check the form.',
          )
        } else if (res.status >= 500) {
          setSubmitError('Something went wrong on our end. Please try again.')
        } else {
          setSubmitError('Something went wrong. Please try again.')
        }
        setIsSubmitting(false)
        return
      }

      // Prefer the full {EA-X-XXX}-{share_token} url segment from the API.
      // Fall back to the bare display id only when the server didn't return a
      // shareUrlId (supabase-not-configured dev path).
      const shareUrlId =
        typeof data.shareUrlId === 'string' && data.shareUrlId
          ? data.shareUrlId
          : data.assessmentId
      router.push(`/assessment/${shareUrlId}`)
    } catch {
      setSubmitError('Network error. Please check your connection and try again.')
      setIsSubmitting(false)
    }
  }, [form, runwayMode, savingsAmount, freedomMultiplier, router, sessionId])

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <h1
          className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Generate Your Escape Assessment
        </h1>
        <p
          className="text-sm sm:text-base"
          style={{ color: 'rgba(255,255,255,0.45)', fontFamily: "'DM Sans', sans-serif" }}
        >
          Answer 9 questions. Get a personalized 14-day sprint, a 90-day roadmap, your Freedom Number, and a personal AI advisor. Three minutes.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white">Your Situation</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleLoadExample}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Load example
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            Reset
          </button>
        </div>
      </div>

      <fieldset disabled={isSubmitting} className="space-y-4">
        {/* 1. First name */}
        <div>
          <Label>First name</Label>
          <input
            type="text"
            value={form.firstName}
            onChange={e => updateField('firstName', e.target.value)}
            placeholder="What should we call you?"
            maxLength={50}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            style={inputStyle}
          />
          <FieldError message={errors.firstName} />
        </div>

        {/* 2. Hours per week */}
        <div>
          <Label>Hours per week you can devote to this</Label>
          <input
            type="number"
            min={1}
            max={80}
            value={form.hoursPerWeek}
            onChange={e => updateField('hoursPerWeek', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 10"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            style={inputStyle}
          />
          <FieldError message={errors.hoursPerWeek} />
        </div>

        {/* 3. Monthly income */}
        <div>
          <Label>Current monthly income (from any source)</Label>
          <input
            type="number"
            min={0}
            value={form.monthlyIncome}
            onChange={e => updateField('monthlyIncome', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 4500"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            style={inputStyle}
          />
          <FieldError message={errors.monthlyIncome} />
        </div>

        {/* 4. Monthly expenses */}
        <div>
          <Label>Current monthly expenses</Label>
          <input
            type="number"
            min={1}
            value={form.monthlyExpenses}
            onChange={e => updateField('monthlyExpenses', e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="e.g. 3000"
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            style={inputStyle}
          />
          <FieldError message={errors.monthlyExpenses} />
        </div>

        {/* 5. Runway with months/dollars toggle */}
        <div>
          <Label>
            How long could you survive without a paycheck?
            <select
              value={runwayMode}
              onChange={e => setRunwayMode(e.target.value as RunwayMode)}
              className="ml-2 text-[10px] rounded px-1 py-0.5 font-normal normal-case tracking-normal"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none' }}
            >
              <option value="months" style={selectOptionStyle}>months</option>
              <option value="amount" style={selectOptionStyle}>$ amount</option>
            </select>
          </Label>
          <p className="text-[11px] mb-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Your savings divided by your monthly expenses — your best estimate.
          </p>
          {runwayMode === 'months' ? (
            <input
              type="number"
              min={0}
              max={120}
              step={0.5}
              value={form.runwayMonths}
              onChange={e => updateField('runwayMonths', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 3"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
              style={inputStyle}
            />
          ) : (
            <input
              type="number"
              min={0}
              value={savingsAmount}
              onChange={e => setSavingsAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 8000"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
              style={inputStyle}
            />
          )}
          <FieldError message={errors.runwayMonths} />
        </div>

        {/* 6. Skill profile */}
        <div>
          <Label>Your skills and experience, in one sentence</Label>
          <input
            type="text"
            value={form.skillProfile}
            onChange={e => updateField('skillProfile', e.target.value)}
            placeholder="e.g. 10 years in marketing, mid-level, comfortable with copywriting and email."
            maxLength={200}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            style={inputStyle}
          />
          <FieldError message={errors.skillProfile} />
        </div>

        {/* 7. Risk tolerance — radio group */}
        <div>
          <Label>Risk tolerance</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {([
              { value: 'low',    title: 'Low',    sub: 'I need stability' },
              { value: 'medium', title: 'Medium', sub: 'I can handle some risk' },
              { value: 'high',   title: 'High',   sub: "I'll bet on myself" },
            ] as const).map(option => {
              const selected = form.riskTolerance === option.value
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => updateField('riskTolerance', option.value)}
                  className="text-left rounded-lg px-3 py-2.5 transition-all"
                  style={{
                    background: selected ? 'rgba(229,9,20,0.12)' : 'rgba(255,255,255,0.04)',
                    border: selected ? '1px solid rgba(229,9,20,0.45)' : '1px solid rgba(255,255,255,0.08)',
                    color: selected ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  <div className="text-xs font-bold">{option.title}</div>
                  <div className="text-[10px]" style={{ color: selected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}>
                    {option.sub}
                  </div>
                </button>
              )
            })}
          </div>
          <FieldError message={errors.riskTolerance} />
        </div>

        {/* 8. Audience access */}
        <div>
          <Label>Where do you already have an audience or access to people?</Label>
          <input
            type="text"
            value={form.audienceAccess}
            onChange={e => updateField('audienceAccess', e.target.value)}
            placeholder="LinkedIn following, email list, online community, coworkers in industry, etc. Type 'None yet' if starting from zero."
            maxLength={300}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            style={inputStyle}
          />
          <FieldError message={errors.audienceAccess} />
        </div>

        {/* 9. Niche signal */}
        <div>
          <Label>What do you want to build?</Label>
          <input
            type="text"
            value={form.nicheSignal}
            onChange={e => updateField('nicheSignal', e.target.value)}
            placeholder="Type 'Not sure' if you don't know yet."
            maxLength={200}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#e50914]"
            style={inputStyle}
          />
          <FieldError message={errors.nicheSignal} />
        </div>

        {/* Freedom multiplier (control, not a "field") */}
        <FreedomMultiplierControl
          monthlyExpenses={
            typeof form.monthlyExpenses === 'number'
              ? form.monthlyExpenses
              : Number(String(form.monthlyExpenses).replace(/[\s$,]/g, '')) || 0
          }
          multiplier={freedomMultiplier}
          onChange={setFreedomMultiplier}
        />
      </fieldset>

      <div className="mt-6">
        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting}
          className="fos-submit-btn w-full px-6 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #e50914, #ff1744)',
            boxShadow: '0 4px 20px rgba(229,9,20,0.35), 0 0 12px rgba(240, 74, 77, 0.25)',
          }}
        >
          {isSubmitting && (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4" strokeDashoffset="10" />
            </svg>
          )}
          {isSubmitting ? 'Generating…' : 'Generate My Escape Assessment'}
        </button>
        {submitError && (
          <p className="text-xs text-center mt-3" style={{ color: '#fca5a5' }}>
            {submitError}
          </p>
        )}
      </div>

      <HamsterLoader visible={isSubmitting} />

      <style>{`
        .fos-submit-btn:hover:not(:disabled) {
          box-shadow:
            0 4px 24px rgba(229, 9, 20, 0.45),
            0 0 24px rgba(240, 74, 77, 0.40) !important;
        }
      `}</style>
    </div>
  )
}
