export function startStopwatch() {
  const start = Date.now()
  return {
    stop() {
      const elapsedMs = Date.now() - start
      const metSLA = elapsedMs <= 5000
      return { elapsedMs, metSLA }
    }
  }
}


