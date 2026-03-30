import {
  getMethodologyPack,
  getOperationsPack,
  getObjectivesDoc,
} from './pack-loader';
import { getCodebaseMap } from './codebase-map';

/**
 * Token budget: packs are prioritized in this order:
 * 1. Methodology (HOW to build)  — ~1000 tokens
 * 2. Operations (WHAT exists)    — ~1000 tokens
 * 3. Objectives (WHY)            — ~1000 tokens
 * 4. Codebase map (WHAT code exists) — ~1500 tokens (paths + names only)
 *
 * Actual file contents are loaded on-demand via the file-reader in the chat
 * route when a user's message references something specific.
 */

export interface KnowledgeContextOptions {
  templateType?: string;
  maxCharsPerPack?: number;
  includeCodebaseMap?: boolean;
}

function truncate(content: string, maxChars: number): string {
  if (content.length <= maxChars) return content;
  const truncated = content.substring(0, maxChars);
  const lastNewline = truncated.lastIndexOf('\n');
  return (
    truncated.substring(0, lastNewline > 0 ? lastNewline : maxChars) +
    '\n\n[... truncated for context window ...]'
  );
}

export function getKnowledgeContext(
  templateTypeOrOptions?: string | KnowledgeContextOptions,
  maxCharsPerPack: number = 4_000
): string {
  const opts: KnowledgeContextOptions =
    typeof templateTypeOrOptions === 'string'
      ? { templateType: templateTypeOrOptions, maxCharsPerPack }
      : templateTypeOrOptions ?? {};

  const charLimit = opts.maxCharsPerPack ?? maxCharsPerPack;
  const methodology = truncate(getMethodologyPack(), charLimit);
  const operations = truncate(getOperationsPack(), charLimit);
  const objectives = truncate(getObjectivesDoc(), charLimit);

  let context = `
=== KNOWLEDGE BASE ===

--- METHODOLOGY PACK (summary) ---
${methodology}

--- PRODUCT OPERATIONS PACK (summary) ---
${operations}

--- OBJECTIVES ---
${objectives}

=== END KNOWLEDGE BASE ===

RULES:
- Reference FEAT-XXX IDs from the packs when creating features
- Map features to objectives and blueprint areas
- Generate all 5 step_data fields for workflow steps
- If you need details about a specific framework (DPS, Virality Matrix, etc.), tell the user which framework is relevant and summarize what you know from the pack excerpts above
`;

  if (opts.includeCodebaseMap !== false) {
    try {
      const codebaseMap = getCodebaseMap();
      context += `\n${codebaseMap}\n`;
    } catch (err) {
      console.warn('[canvas/context-builder] Failed to load codebase map:', err);
    }
  }

  if (opts.templateType === 'integration') {
    context += `\nTEMPLATE: Integration — focus on external services, existing FEAT-XXX dependencies, operational flow position.\n`;
  } else if (opts.templateType === 'workflow') {
    context += `\nTEMPLATE: Workflow — focus on triggers, sequential steps, FEAT-XXX involvement, decision points.\n`;
  } else if (opts.templateType === 'page_feature') {
    context += `\nTEMPLATE: Page Feature — focus on blueprint area, user roles, data sources, FEAT-XXX features powering the page.\n`;
  } else if (opts.templateType === 'feature_request') {
    context += `\nTEMPLATE: Feature Request — assign FEAT-XXX ID, map to objective/capability, identify dependencies.\n`;
  }

  return context;
}
