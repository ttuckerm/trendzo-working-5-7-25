export type ScoreInput = { apiKey: string; url?: string; features?: any }

export async function score({ apiKey, url, features }: ScoreInput): Promise<any> {
  const endpoint = '/public/score'
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ url, features })
  })
  if (!res.ok) {
    const err = await res.json().catch(()=>({ error: 'request_failed' }))
    throw new Error(err.error || 'request_failed')
  }
  return res.json()
}








