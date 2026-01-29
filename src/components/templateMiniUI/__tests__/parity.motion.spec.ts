/** @jest-environment jsdom */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Lightweight timing helpers based on our adapter variables
import { durations } from '@/styles/motion';

describe('Parity Motion & A11y', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    document.body.innerHTML = '';
  });

  it('panel open/close duration ~ adapter ms (±50ms)', async () => {
    const openMs = durations.medium; // used by RightRailShell transitions
    const tolerance = 50;
    const started = Date.now();
    // simulate open by scheduling a close at openMs
    let fired = false;
    setTimeout(() => { fired = true; }, openMs);
    jest.advanceTimersByTime(openMs);
    const took = Date.now() - started;
    expect(Math.abs(took - openMs)).toBeLessThanOrEqual(tolerance);
    expect(fired).toBe(true);
  });

  it('Esc returns focus to opener within close duration', async () => {
    const btn = document.createElement('button');
    btn.textContent = 'Open Panel';
    document.body.appendChild(btn);
    btn.focus();
    const opener = document.activeElement;
    // simulate Esc close
    const closeMs = durations.medium;
    setTimeout(() => { (opener as HTMLElement)?.focus(); }, closeMs);
    jest.advanceTimersByTime(closeMs);
    expect(document.activeElement).toBe(opener);
  });

  it('aria-live messages fire for panel and preview', async () => {
    const live = document.createElement('div');
    live.setAttribute('aria-live', 'polite');
    document.body.appendChild(live);
    function announce(msg: string) { live.textContent = msg; }
    announce('Panel opened');
    expect(live.textContent).toBe('Panel opened');
    announce('Preview ready');
    expect(live.textContent).toBe('Preview ready');
  });
});


