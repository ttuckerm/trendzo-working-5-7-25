-- Agent Attribution — named AI specialist attribution on generated content
-- Pure UX labeling layer: which agent persona generated this content

alter table pre_generated_briefs
  add column if not exists generated_by_agent text default 'Brief Architect';

alter table cultural_events
  add column if not exists generated_by_agent text default 'Trend Scout';

comment on column pre_generated_briefs.generated_by_agent is 'Named agent persona that generated this brief (UX attribution)';
comment on column cultural_events.generated_by_agent is 'Named agent persona that detected this event (UX attribution)';
