/**
 * Prompt 39 — Recommendation extractor
 *
 * Parses the plan_output.text markdown from a completed planning
 * session and returns a list of candidate action items. This is a
 * deliberately simple heuristic:
 *
 *   1. Look for a "Recommendations" / "Top N" / "Action items" header.
 *   2. After that header, pull every top-level numbered list item
 *      (`^1.`, `^2.`, ...) until the next header.
 *   3. Each item's first line becomes the title; any following
 *      indented or sub-bullet lines become the description.
 *
 * If no matching header is found, we fall back to the first 5 numbered
 * items anywhere in the document so we never return an empty list for
 * a plan that clearly has recommendations but uses an unexpected
 * heading. The Chairman can always edit/delete on the review page.
 */

export interface ExtractedRecommendation {
  title: string;
  description: string | null;
}

// Case-insensitive match for any H1/H2/H3 whose text contains one of
// these phrases. Deliberately permissive.
const RECOMMENDATION_HEADER_RE =
  /^#{1,3}\s+.*\b(recommendations?|top\s*\d*|action\s*items?|next\s*steps?|plan)\b.*$/i;

const NUMBERED_ITEM_RE = /^(\d+)\.\s+(.*)$/;
const HEADER_RE = /^#{1,6}\s/;

export function extractRecommendations(
  markdown: string,
  maxItems = 10,
): ExtractedRecommendation[] {
  if (!markdown || typeof markdown !== 'string') return [];

  const lines = markdown.split('\n');
  let inRecommendationSection = false;
  let foundHeader = false;

  const items: ExtractedRecommendation[] = [];
  let current: { title: string; descLines: string[] } | null = null;

  const flush = () => {
    if (current) {
      const desc = current.descLines.join(' ').trim();
      items.push({
        title: current.title.trim(),
        description: desc.length > 0 ? desc : null,
      });
      current = null;
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');

    if (RECOMMENDATION_HEADER_RE.test(line)) {
      flush();
      inRecommendationSection = true;
      foundHeader = true;
      continue;
    }

    if (inRecommendationSection && HEADER_RE.test(line)) {
      // Hit a new header after our section — stop collecting.
      flush();
      inRecommendationSection = false;
      continue;
    }

    if (!inRecommendationSection) continue;

    const m = line.match(NUMBERED_ITEM_RE);
    if (m) {
      flush();
      current = { title: m[2], descLines: [] };
      continue;
    }

    // Continuation line for the current item — indented text, sub-bullet,
    // or a plain wrapped line.
    if (current && line.trim().length > 0) {
      // Strip common sub-bullet prefixes so the description reads cleanly.
      const cleaned = line
        .replace(/^\s{2,}[-*]\s+/, '')
        .replace(/^\s+/, '')
        .trim();
      if (cleaned) current.descLines.push(cleaned);
    }
  }
  flush();

  // Fallback: no "Recommendations" header found, so pull the first
  // numbered items we see anywhere in the doc.
  if (!foundHeader) {
    for (const raw of lines) {
      const m = raw.match(NUMBERED_ITEM_RE);
      if (m) {
        items.push({ title: m[2].trim(), description: null });
        if (items.length >= maxItems) break;
      }
    }
  }

  return items.slice(0, maxItems);
}
