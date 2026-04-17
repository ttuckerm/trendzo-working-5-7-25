# Session Protocol

> Open this file. Start at Step 1. Do them in order. Don't skip ahead.

---

## STEP 1: Load Context (2 min)

- [ ] Open `SYSTEM_STATE.md`
- [ ] Read the **Last Session** table — specifically the "Next session starts with" field
- [ ] Copy the entire contents of `SYSTEM_STATE.md`
- [ ] Open Cursor AI chat → paste it → add: *"This is my current system state. I'm picking up where I left off."*

---

## STEP 2: Pick ONE Thing (3 min)

Answer this out loud or write it down:

> **"Today I am building: _______________"**

Rules:
- ONE feature. Not two. Not "and also clean up X."
- If you don't know what to build → open `SUBSTRATE_FRAMEWORK.md` → read "When You're Stuck"
- If you have a new idea → copy `FEATURE_SCORECARD.md` to `scorecards/SCORECARD_[name].md` → fill it out first → THEN decide
- Update the **Current Focus** field in `SYSTEM_STATE.md` right now

---

## STEP 3: Do You Have a Spec? (1 min)

- [ ] **YES** → go to Step 5 (Build)
- [ ] **NO** → go to Step 4 (Write Spec)

---

## STEP 4: Write the Spec (max 2 hours)

Write these three sections. If you can't finish all three, stop — you need to read your code before you can spec this.

**A. What the user sees and does**
- What screen/surface is this on?
- What does the user do, step by step?
- What do they see at each step? (loading / result / empty / error)
- How does this make them feel higher-status?

**B. What data moves where**
- Where does input come from? (Supabase table / API / user input)
- What computation happens?
- Where does output go? (UI component / DB write / event)
- New tables or columns?
- What events does this emit via `emitEvent()`?

**C. What existing code this touches**
- List the files you'll modify
- Components you'll reuse via render contract
- Feature flag name + tier access (Chairman/Admin/Agency/User)
- Prediction object fields affected?
- Tech debt you already know you'll hit

**When done:** paste the spec into Cursor AI chat as your build prompt. Go to Step 5.

---

## STEP 5: Build

- [ ] Commit every 30–60 min
- [ ] Cursor drifts from spec → stop it immediately, re-paste the spec section it's violating
- [ ] Hit messy code?
  - Small mess (< 30% of feature scope) → fix inline
  - Big mess (> 30%) → add `// TECH-DEBT: [what] [today's date]` → move on

---

## STEP 6: Polish

Run through this checklist before you call it done:

- [ ] Background is `#08080d`
- [ ] Fonts: Playfair Display (headings) / DM Sans (body) / JetBrains Mono (code/data)
- [ ] Accent colors (Crimson/Violet/Cyan/Gold/Green) used with intent
- [ ] Loading state exists
- [ ] Error state exists with an actionable message
- [ ] Empty state exists (not blank)
- [ ] Animations feel intentional, not default
- [ ] **Does this make the user feel like they have an unfair advantage?** If no → fix before shipping

---

## STEP 7: Ship

- [ ] Deploy behind feature flag (disabled)
- [ ] Walk through every step from your spec Section A against the deployed version
- [ ] Matches spec → flip the flag (Chairman tier first)
- [ ] Doesn't match → write a specific bug list (not "it's broken" — what exactly is wrong)

---

## STEP 8: Close the Session (10 min)

**Do not skip this. This is how tomorrow's session starts clean.**

Open `SYSTEM_STATE.md` and fill in / update each of these:

- [ ] **Last updated:** → today's date
- [ ] **Current Focus:** → update or clear if done
- [ ] **Last Session table:**

  | Field | Fill in |
  |-------|---------|
  | Date | Today's date |
  | What was built | Name the specific thing. "Built X component" not "worked on stuff" |
  | What's half-done | Be specific: "component renders but doesn't save to DB" not "WIP" |
  | Decisions made | Any forks you chose and why — future you will forget |
  | Next session starts with | The exact first action for next time |

- [ ] **Feature Flags table:** add/update any flags you touched today
- [ ] **Tech Debt Queue:** add any `// TECH-DEBT:` comments you wrote today

  | Location | Description | Priority | Date Tagged |
  |----------|-------------|----------|------------|
  | file path | what's wrong | H/M/L | today |

- [ ] **Capability Prerequisite Map:** did you discover that building X would make Y trivial? Add it.
- [ ] **Architecture Primitives Status:** update if you touched Event Spine, Prediction Object, Render Contracts, Feature Flags, or Zod schemas

**Commit `SYSTEM_STATE.md` with your code. Done.**