# Session Protocol

> Open this at the start of every coding session. Follow it linearly.

---

## Pre-Session — 5 min

- [ ] Open and read `SYSTEM_STATE.md`
- [ ] Feed `SYSTEM_STATE.md` to Cursor/Claude Code as first context
- [ ] Answer: **What is today's ONE feature?** Write it here: ___
- [ ] Confirm: is the spec written for this feature?
  - **Yes** → skip to Build Phase
  - **No** → go to Spec Phase. Do not write code.

---

## Spec Phase — max 2 hours

Write a three-section spec. If you can't complete all three sections, you don't understand your system well enough — go read the code first.

### Section A: What the user sees and does
- Screen/surface where this appears
- User action sequence (step by step)
- What the user sees at each step (loading → result → empty state → error)
- How this makes the user feel higher-status

### Section B: What data moves where
- Input data source (Supabase table, API, user input)
- Transformations / computation
- Output destination (UI component, database write, event emission)
- New tables or columns needed
- Events this emits via `emitEvent()`

### Section C: What existing code this touches and how
- Files modified (list them)
- Components reused via render contract
- Feature flag name and tier access (Chairman/Admin/Agency/User)
- Prediction object fields affected (if any)
- Tech debt encountered that's relevant

> **Spec done? Paste it into Cursor/Claude Code as the build prompt.**

---

## Build Phase

- [ ] Commit every 30–60 minutes. No exceptions.
- [ ] If Cursor drifts from spec, stop and correct immediately. Don't let drift compound.
- [ ] **30% Rule** on surrounding messy code:
  - Less than 30% of feature scope → fix it inline now
  - More than 30% of feature scope → add `// TECH-DEBT: [description] [date]` comment and move on
- [ ] Emit events via `emitEvent()` for every meaningful user action in this feature
- [ ] Wire feature flag: add row to `feature_flags` table, wrap UI in `useFlag()` hook

---

## Polish Phase

- [ ] **Design system compliance:**
  - Background: `#08080d`
  - Typography: Playfair Display (headings) / DM Sans (body) / JetBrains Mono (code/data)
  - Accent colors: Crimson / Violet / Cyan / Gold / Green — used purposefully, not decoratively
- [ ] **State coverage:**
  - Loading state exists and feels considered
  - Error state exists with actionable message
  - Empty state exists and isn't just blank space
- [ ] **Animation and spacing:**
  - Easing curves feel intentional (not default linear)
  - Spacing is consistent with existing surfaces
  - Transitions don't feel generated — they feel designed
- [ ] **Status-check:** Does this surface make the user feel like they have an unfair advantage?
  - If no → identify what's missing and fix it before shipping

---

## Ship Phase

- [ ] Deploy behind feature flag (flag set to `disabled`)
- [ ] Test deployed version against spec — walk through every step in Section A
- [ ] **If it matches spec:** flip the flag for your tier (Chairman first)
- [ ] **If it doesn't match:** write a specific bug list — not "it's not done," but "step 3 shows wrong loading state" or "event not emitting on save"

---

## Session Close — 10 min

- [ ] Update `SYSTEM_STATE.md`:
  - What was built
  - What's half-done (be specific — "component renders but doesn't save" not "WIP")
  - Decisions made and why
  - What next session should start with
- [ ] If any `// TECH-DEBT:` comments were added this session, add them to the Tech Debt Queue in `SYSTEM_STATE.md`
- [ ] If a new capability prerequisite was discovered, add it to the Capability Prerequisite Map in `SYSTEM_STATE.md`