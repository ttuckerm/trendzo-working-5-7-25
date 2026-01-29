export type ValidationSeverity = "error" | "warn";

export interface ValidationResult<TTemplate = any> {
  id: string;
  severity: ValidationSeverity;
  message: string;
  fix?: {
    label: string;
    apply: (template: TTemplate) => TTemplate;
  };
}

export interface TemplateLike {
  slots: {
    hook: string;
    onScreenText: string;
    captions: string;
    hashtags: string[];
    shotList: string[];
    thumbnailBrief: string;
    first3sCue: string;
  };
}

function hasInvalidBraces(text: string): boolean {
  // very simple check for unbalanced braces or double closing
  let depth = 0;
  for (const ch of text) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth < 0) return true;
  }
  return depth !== 0;
}

export class ValidationEngine {
  async run(template: TemplateLike): Promise<ValidationResult<TemplateLike["slots"]>[]> {
    const issues: ValidationResult<TemplateLike["slots"]>[] = [];
    const s = template.slots;

    // 1) missingTitle
    if (!s.hook || s.hook.trim().length === 0) {
      issues.push({
        id: 'missingTitle',
        severity: 'error',
        message: 'Title/Hook is missing.',
        fix: {
          label: 'Set default title',
          apply: (slots) => ({ ...slots, hook: 'Untitled' }),
        },
      });
    }

    // 2) invalidTokens (either malformed braces or missing a required token)
    const requiredTokens = ['{brand}', '{cta}'];
    const combined = `${s.onScreenText}\n${s.captions}`;
    const missingRequired = !requiredTokens.some((t) => combined.includes(t));
    const malformed = hasInvalidBraces(combined);
    if (malformed || missingRequired) {
      issues.push({
        id: 'invalidTokens',
        severity: 'warn',
        message: malformed
          ? 'Found malformed token braces in text.'
          : 'Missing a required token like {brand} or {cta}.',
        fix: {
          label: malformed ? 'Sanitize tokens' : 'Insert required token',
          apply: (slots) => {
            if (malformed) {
              // naive sanitize: strip lone braces
              const sanitize = (t: string) => t.replace(/\{/g, '[').replace(/\}/g, ']');
              return { ...slots, onScreenText: sanitize(slots.onScreenText), captions: sanitize(slots.captions) };
            }
            // insert CTA token into captions
            const next = slots.captions && slots.captions.length > 0 ? `${slots.captions} — {cta}` : 'Tap to learn more {cta}';
            return { ...slots, captions: next };
          },
        },
      });
    }

    // 3) unusedVariable (pretend `discount` is declared but unused)
    const declared = ['discount'];
    const used = /\{discount\}/.test(combined);
    if (!used) {
      issues.push({
        id: 'unusedVariable',
        severity: 'warn',
        message: 'Variable {discount} declared but not used in text.',
        fix: {
          label: 'Use {discount} in captions',
          apply: (slots) => {
            const suffix = slots.captions && slots.captions.length > 0 ? ' ' : '';
            return { ...slots, captions: `${slots.captions || ''}${suffix}Save {discount}% today` };
          },
        },
      });
    }

    return issues;
  }
}


