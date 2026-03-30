/**
 * Cinematic Template System
 * Compiles structured prompt fields into a single-paragraph cinematic prompt
 * for AI video generation tools (Sora, Runway, Kling)
 */

export interface TemplateFields {
  title: string;
  flavor_tag: string;
  audience: { locale: string; tone_note: string };
  reference_images: string[];
  subject_type: string;
  key_features: string;
  lighting: string;
  grade: string;
  visual_taste: string;
  background_location: string;
  camera: string;
  lens_focus: string;
  coverage: string;
  persist: string;
  bgm: string;
  sfx: string;
  cues: string;
  dialogues: string;
}

export class CinematicTemplate {
  /**
   * Compiles template fields into a single continuous paragraph
   * NO line breaks - required for AI video tools
   */
  compile(fields: TemplateFields): string {
    const parts: string[] = [];

    // Title and flavor
    parts.push(`${fields.title} — ${fields.flavor_tag}.`);

    // Subject / Scene Settings
    parts.push(`Subject / Scene Settings:`);
    parts.push(`Audience: {locale:"${fields.audience.locale}"; tone_note:"${fields.audience.tone_note}"};`);
    parts.push(`Reference images: ${fields.reference_images.length === 0 ? '[none]' : `[${fields.reference_images.join(', ')}]`};`);
    parts.push(`Subject type: ${fields.subject_type};`);
    parts.push(`Key features: ${fields.key_features};`);

    // Visual specifications
    parts.push(`Lighting: ${fields.lighting};`);
    parts.push(`Grade: ${fields.grade};`);
    parts.push(`Visual taste: ${fields.visual_taste};`);
    parts.push(`Background/Location: ${fields.background_location};`);

    // Camera specifications
    parts.push(`Camera: ${fields.camera};`);
    parts.push(`Lens/Focus: ${fields.lens_focus};`);
    parts.push(`Coverage: ${fields.coverage};`);
    parts.push(`Persist: ${fields.persist}.`);

    // Audio specifications
    parts.push(`Audio (BGM & SFX):`);
    parts.push(`BGM: ${fields.bgm};`);
    parts.push(`SFX: ${fields.sfx};`);
    parts.push(`Cues: ${fields.cues}.`);

    // Dialogues
    parts.push(`Dialogues / Subtitles / VO (optional): ${fields.dialogues}.`);

    // Join with spaces (NOT newlines) - critical for AI video tools
    return parts.join(' ');
  }

  /**
   * Validates template fields before compilation
   */
  validate(fields: Partial<TemplateFields>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!fields.title) errors.push('Title is required');
    if (!fields.key_features) errors.push('Key features are required');
    if (!fields.lighting) errors.push('Lighting specification is required');
    if (!fields.camera) errors.push('Camera specification is required');

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
