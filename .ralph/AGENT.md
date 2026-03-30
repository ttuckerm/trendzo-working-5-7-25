---

## ABSOLUTE VERIFICATION REQUIREMENT (NON-NEGOTIABLE)

### NO TASK MAY BE MARKED [x] COMPLETE WITHOUT:

1. **BROWSER VERIFICATION** - You must test the change in the running application
2. **EVIDENCE** - State exactly what you tested and what you observed
3. **NO ASSUMPTIONS** - "Should work" is NOT verification. Only "I tested and confirmed" counts.

### VERIFICATION PROTOCOL:

For EVERY task, before marking `[x]`:

1. Save all files
2. Wait for hot reload OR restart dev server if needed
3. Open the relevant page in browser (use the MCP browser tools or instruct user)
4. Perform the exact user action the fix addresses
5. Confirm the expected behavior occurs
6. If it fails: DO NOT mark complete. Document the failure and fix it.

### FORBIDDEN BEHAVIORS:

- ❌ Marking tasks complete based on "code looks right"
- ❌ Marking tasks complete without testing in browser
- ❌ Claiming "4/4 done" when you haven't verified each one
- ❌ Moving to next task when current task has failing behavior

### REQUIRED EVIDENCE FORMAT:

After each task, report:

```
VERIFICATION:
- Tested: [exact action taken]
- URL: [page tested]
- Result: [PASS/FAIL + what you observed]
- Evidence: [console output, visible text, behavior seen]
```

If you cannot verify (e.g., no browser access), you MUST say:

> "I cannot verify this change. User must test at [URL] and confirm [expected behavior]."

---

# Ralph Agent Instructions

## Project Context

You are working on **Trendzo**, a viral video prediction platform. The current task is implementing **Workflow 1** improvements to align with Paul's content creation methodology.

## Key Principles

### 1. Read CLAUDE.md First
Always read `CLAUDE.md` at the project root before making changes. It contains:
- Non-negotiable rules
- Required verification steps
- Project architecture

### 2. Follow the Safe Edit Policy
- Small diffs, not sweeping changes
- Verify before modifying
- Run `npx tsc --noEmit` after TypeScript changes
- Run `npm test` after logic changes

### 3. Preserve Existing Functionality
Workflow 1 already has:
- `src/lib/workflow-specs/workflow-1-spec.ts` - Keep types, extend them
- `src/app/studio/creator/page.tsx` - Refactor, don't delete
- `src/components/workflow/` - Add components here

### 4. Use Existing Patterns
The codebase uses:
- Next.js 14 App Router
- Supabase for database
- Zustand for state management
- Tailwind CSS for styling
- shadcn/ui components

---

## MANDATORY: Progress Logging (Ralph Loop Core)

**This is the most important section.** Without progress logging, you will repeat the same mistakes.

### At Session START:
1. **READ** `.ralph/PROGRESS.md` first
2. Check "Known Issues Registry" for problems to avoid
3. Check "Lessons Learned" for patterns to follow
4. Identify the next incomplete task from `fix_plan.md`

### At Session END (or after each task):
1. **UPDATE** `.ralph/PROGRESS.md` with a new session entry
2. Document what you attempted
3. Document what worked and what failed
4. Document specific mistakes (file paths, line numbers)
5. Document what the next session should do

### Progress Update Template

Add this to PROGRESS.md after each task:

```markdown
### Session [N] - [DATE]

**Task:** [Task name from fix_plan.md]

**Attempted:**
- [What you tried, be specific]

**Result:** [Success / Failure / Partial]

**Mistakes Made:**
1. [Specific mistake - include file:line if applicable]

**What Needs Fixing:**
- [What the next session should do]
```

### Why This Matters

- Each session starts with FRESH context (no memory of previous sessions)
- PROGRESS.md is how you "remember" what happened before
- Without it, you'll make the same mistakes over and over
- The user will get frustrated re-explaining problems

---

## Task Execution

### When Starting a Task
1. Read the relevant files first
2. Check if the feature already exists
3. Understand the current state before changing

### When Creating Components
1. Follow existing component patterns in `src/components/`
2. Use TypeScript strictly
3. Use shadcn/ui primitives where possible
4. Add loading and error states

### When Creating Database Migrations
1. Use consistent naming: `YYYYMMDD_descriptive_name.sql`
2. Add RLS policies for all tables
3. Test migration can be rolled back

### When Updating Types
1. Keep backward compatibility
2. Add new interfaces, don't modify existing ones unless necessary
3. Export from appropriate barrel files

## Verification

After every significant change:
```bash
npx tsc --noEmit          # Type check
npm test                  # Run tests
npm run build             # Build check (optional)
```

## Files Reference

### Must Read (IN THIS ORDER)
1. `.ralph/PROGRESS.md` - **READ FIRST** - What happened in previous sessions, mistakes to avoid
2. `CLAUDE.md` - Project operating system
3. `.ralph/PROMPT.md` - This project's requirements
4. `.ralph/fix_plan.md` - Task checklist (check what's done/not done)

### Key Files for Workflow 1
- `src/lib/workflow-specs/workflow-1-spec.ts`
- `src/app/studio/creator/page.tsx`
- `src/components/workflow/`
- `.planning/WORKFLOW-ARCHITECTURE.md`

### Database
- `supabase/migrations/` - Add new migrations here
- Check existing schema before creating tables

## Ralph Loop Script

The automated task runner that gives each task a fresh Claude Code context.

### Running the Loop

```powershell
# Navigate to project root
cd C:\Projects\CleanCopy

# Run the loop (starts autonomous task execution)
.\.ralph\ralph-loop.ps1

# Preview mode (see what would happen without executing)
.\.ralph\ralph-loop.ps1 -DryRun

# Limit iterations
.\.ralph\ralph-loop.ps1 -MaxIterations 10

# Adjust delay between tasks (seconds)
.\.ralph\ralph-loop.ps1 -DelayBetweenTasks 10
```

### How It Works

1. **Reads `fix_plan.md`** - Finds the first line with `- [ ]` (incomplete task)
2. **Reads `PROGRESS.md`** - Gets context on what was tried before
3. **Starts Claude Code** - Fresh session with focused prompt for ONE task
4. **Claude works** - Either marks task complete or documents failure
5. **Loops** - Continues until all tasks done or 3 consecutive failures

### Why Fresh Sessions?

- Prevents "context rot" (confusion from long conversations)
- Each task gets full context window
- Failures don't contaminate next task's context
- More reliable than one long session

### When to Use

- After writing a `fix_plan.md` with checkboxed tasks
- When you want hands-off execution
- When tasks are well-defined and independent

### When NOT to Use

- For exploratory work (use interactive Claude instead)
- When tasks depend heavily on each other
- When you need to guide decisions interactively

---

## Communication

### During Session:
- Update `.ralph/fix_plan.md` as tasks complete
- Mark tasks with [x] when done
- Add notes if you encounter blockers

### At Session End (REQUIRED):
- **UPDATE `.ralph/PROGRESS.md`** with what you attempted and what happened
- Be specific about mistakes (include file paths and line numbers)
- Document what the next session should do
- This is NOT optional - it's how the Ralph Loop works
