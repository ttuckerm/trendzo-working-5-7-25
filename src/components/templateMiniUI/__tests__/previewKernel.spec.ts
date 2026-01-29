/** @jest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PreviewKernel } from '@/components/templateMiniUI/preview/PreviewKernel';

// Mock durations used by PreviewKernel.cancel debounce
jest.mock('@/styles/motion', () => ({ durations: { fast: 100, medium: 160 } }));

describe('PreviewKernel - cancellation and order', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		// @ts-ignore
		global.fetch = jest.fn();
	});
	afterEach(() => {
		jest.useRealTimers();
		// @ts-ignore
		global.fetch = undefined as any;
	});

	it('cancel() moves state to idle after close duration and aborts in-flight', async () => {
		const kernel = new PreviewKernel('t1');
		const onProgress = jest.fn();
		const onError = jest.fn();
		kernel.onProgress(onProgress).onError(onError);

		// Schedule an update so an AbortController is created
		(kernel as any).debounceTimer && clearTimeout((kernel as any).debounceTimer);
		// Mock pending fetch before timers fire
		(global.fetch as any).mockImplementation(() => new Promise(() => {}));
		kernel.update({ foo: 'bar' }, { reason: 'test' });
		// Advance to pass debounce and start fetch
		jest.advanceTimersByTime(100);

		// cancel should abort and schedule idle after medium duration
		kernel.cancel('test');
		expect(onProgress).toHaveBeenLastCalledWith('loading');
		// advance medium duration
		jest.advanceTimersByTime(160);
		expect(onProgress).toHaveBeenLastCalledWith('idle');
	});

	it('later update result should not be overwritten by slower earlier request', async () => {
		// Use real timers to better model AbortController
		jest.useRealTimers();
		const kernel = new PreviewKernel('t2');
		const onProgress = jest.fn();
		const onResult = jest.fn();
		kernel.onProgress(onProgress).onResult(onResult);

		let call = 0;
		// @ts-ignore
		global.fetch = jest.fn((url: string, opts: any) => {
			const signal: AbortSignal | undefined = opts?.signal;
			const thisCall = ++call;
			return Promise.resolve({
				ok: true,
				json: () => new Promise((resolve, reject) => {
					const payload = thisCall === 1 ? { html: '<i>old</i>', meta: { i: 1 } } : { html: '<b>new</b>', meta: { i: 2 } };
					const delay = thisCall === 1 ? 50 : 0;
					if (signal?.aborted) {
						reject(Object.assign(new Error('AbortError'), { name: 'AbortError' }));
						return;
					}
					const timer = setTimeout(() => resolve(payload), delay);
					signal?.addEventListener('abort', () => {
						clearTimeout(timer);
						reject(Object.assign(new Error('AbortError'), { name: 'AbortError' }));
					});
				}),
			});
		});

		kernel.update({ a: 1 });
		await new Promise((r) => setTimeout(r, 110)); // pass debounce
		kernel.update({ b: 2 });
		await new Promise((r) => setTimeout(r, 110)); // pass debounce for second
		await new Promise((r) => setTimeout(r, 10)); // allow immediate second json
		expect(onResult).toHaveBeenLastCalledWith({ html: '<b>new</b>', meta: { i: 2 } });

		// let the first (aborted) attempt try to resolve
		await new Promise((r) => setTimeout(r, 70));
		expect(onResult).toHaveBeenLastCalledWith({ html: '<b>new</b>', meta: { i: 2 } });
	});
});
