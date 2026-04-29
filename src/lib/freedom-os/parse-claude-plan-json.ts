/**
 * Extract and parse JSON from Claude text (handles optional ```json fences).
 */
export function extractJsonObject(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```/m.exec(trimmed)
  const raw = fence ? fence[1].trim() : trimmed
  const parsed = JSON.parse(raw) as unknown
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object at the root')
  }
  return parsed as Record<string, unknown>
}
