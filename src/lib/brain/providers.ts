export const providers = [
    { tag: "openai",   model: process.env.OPENAI_MODEL  ?? "gpt-4.1",   key: process.env.OPENAI_API_KEY },
    { tag: "anthropic",model: process.env.ANTH_MODEL    ?? "claude-3-5-opus-latest", key: process.env.ANTHROPIC_API_KEY },
    // add others only if keys exist
  ].filter(p => !!p.key);
  