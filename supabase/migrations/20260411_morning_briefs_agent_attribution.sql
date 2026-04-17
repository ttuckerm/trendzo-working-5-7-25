-- Agent attribution on morning_briefs (parity with pre_generated_briefs and cultural_events)
alter table morning_briefs
  add column if not exists generated_by_agent text default 'Brief Architect';

comment on column morning_briefs.generated_by_agent is 'Named agent persona that composed this morning brief (UX attribution). Per-card attribution lives inside cards[].generated_by_agent.';
