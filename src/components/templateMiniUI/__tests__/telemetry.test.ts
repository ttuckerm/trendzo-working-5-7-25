/** @jest-environment jsdom */
import { logTemplateEvent } from '@/components/templateMiniUI/events'

describe('telemetry logger', () => {
  it('sends open event', async () => {
    const spy = jest.spyOn(global as any, 'fetch').mockResolvedValue({ ok: true } as any)
    await logTemplateEvent({ event_type: 'open', template_id: 't1', platform: 'tiktok' })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})


