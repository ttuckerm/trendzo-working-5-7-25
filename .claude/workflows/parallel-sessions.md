# Parallel Claude Sessions Workflow

Per Boris Cherny (Claude Code creator): "I run 5 Claudes in parallel in my terminal"

---

## Overview

Running multiple Claude sessions in parallel dramatically increases productivity by allowing:
- Concurrent work on independent tasks
- Specialized sessions for different work types
- Background processing while actively developing
- Quick context switches without losing state

---

## Local Terminal Setup (5 Sessions)

### Session Specialization

| Tab | Name | Purpose | Typical Tasks |
|-----|------|---------|---------------|
| 1 | **Main** | Active feature development | Current sprint work, new features |
| 2 | **Verify** | Testing and verification | Run tests, type checks, smoke tests |
| 3 | **Docs** | Documentation updates | CLAUDE.md, comments, README |
| 4 | **Hotfix** | Bug fixes and quick patches | Production issues, urgent fixes |
| 5 | **Explore** | Research and exploration | Code analysis, refactoring plans |

### Starting Sessions

In each terminal tab:

```bash
# Tab 1 - Main development
cd c:\Projects\CleanCopy
claude

# Tab 2 - Verification mode
cd c:\Projects\CleanCopy
claude
# Then: "You are in verification mode. Run tests and type checks after each prompt."

# Tab 3 - Documentation mode
cd c:\Projects\CleanCopy
claude
# Then: "You are in docs mode. Focus on documentation and CLAUDE.md updates."

# Tab 4 - Hotfix mode
cd c:\Projects\CleanCopy
claude
# Then: "You are in hotfix mode. Small, surgical fixes only."

# Tab 5 - Exploration mode
cd c:\Projects\CleanCopy
claude
# Then: "You are in exploration mode. Research and analysis, no edits without permission."
```

### Session Notifications

Enable system notifications to know when a Claude needs input:
- **Windows**: Notifications appear in Action Center
- **Mac**: Uses native notification center
- **Linux**: Uses notify-send or similar

---

## Web Sessions (claude.ai/code)

Boris also runs 5-10 web Claudes alongside local sessions.

### When to Use Web vs Local

| Use Web For | Use Local For |
|-------------|---------------|
| Long-running tasks (hours) | Active development |
| Can check from phone later | Immediate feedback needed |
| Background processing | File editing |
| Tasks that don't need file access | Git operations |

### Starting Web Sessions

1. Go to [claude.ai/code](https://claude.ai/code)
2. Connect to your GitHub repo
3. Select branch
4. Start session with clear context

**Example prompt for web session:**
```
I'm working on the Trendzo project (viral video prediction).
Branch: feature/accuracy-improvements
Goal: Run full test suite and report any failures
Please run: npm test && npm run test:integration
Report back with results. I'll check this later.
```

---

## Session Handoff Protocol

When transferring work between sessions (local↔local or local↔web):

### Step 1: Commit Current State

```bash
git add -A
git commit -m "WIP: [description of current state]"
git push origin [branch]
```

### Step 2: Note Handoff Context

Document:
- Current commit hash
- What's complete
- What's in progress
- What's blocked/waiting

### Step 3: Start New Session with Context

**Handoff Prompt Template:**
```
Continuing from commit [abc123] on branch [feature/xyz].

Goal: [What we're trying to accomplish]

Current State:
- ✅ Completed: [what's done]
- 🔄 In Progress: [what's partially done]
- ⏳ Next: [what to do next]

Files Modified:
- src/lib/prediction/runPredictionPipeline.ts (added caching)
- src/app/api/predict/route.ts (updated to use pipeline)

Please continue from here.
```

---

## Teleporting Between Environments

"Teleporting" = Moving a session between local and web.

### Local → Web

1. Push current branch: `git push origin [branch]`
2. Open [claude.ai/code](https://claude.ai/code)
3. Connect to repo, select branch
4. Share the handoff context (see above)

### Web → Local

1. Pull latest: `git pull origin [branch]`
2. In local Claude: "I was working on this in web. [share context]"
3. Continue locally

---

## Multi-Session Best Practices

### DO:
- ✅ Commit frequently (every logical change)
- ✅ Use descriptive branch names
- ✅ Keep sessions focused on one task type
- ✅ Use handoff protocol when switching
- ✅ Let background sessions run to completion

### DON'T:
- ❌ Have multiple sessions edit the same file
- ❌ Forget to push before teleporting
- ❌ Mix task types in a single session
- ❌ Leave sessions idle for hours (context decay)
- ❌ Ignore verification session results

---

## Trendzo-Specific Session Templates

### Prediction Development Session

```
You are working on Trendzo's prediction pipeline.

Key files:
- src/lib/prediction/runPredictionPipeline.ts
- src/lib/orchestration/kai-orchestrator.ts

Rules from CLAUDE.md:
- All predictions through runPredictionPipeline()
- Write to canonical tables only
- Run /verify after changes
```

### Component Development Session

```
You are working on Trendzo's component system.

Reference: docs/COMPONENT_RUBRIC_AUDIT.md

When adding/modifying components:
1. Check component registry in kai-orchestrator.ts
2. Create/update test file
3. If subjective, create rubric (see rubric-builder agent)
4. Register in component list
```

### Verification Session

```
You are the verification agent for Trendzo.

After each main session makes changes:
1. Run: npx tsc --noEmit
2. Run: npm run test:smoke
3. If server running: test /api/predict endpoint
4. Report: PASS/FAIL with details

Reference: .claude/agents/verify-app.md
```

### Feature Extraction Session

```
You are working on Trendzo's 119-feature extraction system.

Reference: .claude/commands/validate-features.md

Tasks:
- Validate feature completeness
- Debug missing/invalid features
- Check feature value distributions
```

### Database Session

```
You are working on Trendzo's Supabase database.

Canonical tables:
- prediction_runs (immutable)
- run_component_results (keyed by run_id)
- artifact_cache (content-addressed)

Rules:
- Never write to deprecated tables
- Always use migrations for schema changes
- Test queries locally before production
```

---

## Session Monitoring

### Check Session Health

```bash
# See all Claude processes
ps aux | grep claude

# Check terminal tabs
# Windows Terminal: Ctrl+Tab to cycle
# iTerm2: Cmd+Shift+] to cycle
# VS Code: Ctrl+PageDown to cycle
```

### Kill Stuck Session

If a Claude session is stuck:

```bash
# Find the process
ps aux | grep claude

# Kill it
kill -9 [PID]

# Start fresh
claude
```

---

## Conflict Resolution

### File Conflicts

When two sessions edited the same file:

```bash
# Check for conflicts
git status

# Stash local changes
git stash

# Pull remote changes
git pull origin [branch]

# Apply stash
git stash pop

# Resolve conflicts manually
```

### State Conflicts

When sessions have divergent understanding:

1. Commit both states to separate branches
2. Compare: `git diff branch1..branch2`
3. Merge the better state
4. Delete the other branch

---

## Troubleshooting

### "Session lost context"
- Sessions don't persist after terminal close
- Always commit before closing
- Use handoff protocol to restore context

### "Conflicting edits"
- Two sessions edited the same file
- Solution: Use `git stash`, resolve manually
- Prevention: Specialize sessions by task type

### "Session too slow"
- Large context can slow down
- Start fresh session for new tasks
- Use `/compact` to summarize if available

### "Can't connect to web"
- Check internet connection
- Verify GitHub permissions
- Try incognito/private browser

---

## Quick Reference

| Action | Command/Steps |
|--------|---------------|
| Start local session | `cd project && claude` |
| Start web session | [claude.ai/code](https://claude.ai/code) → Connect repo |
| Switch tabs | `Ctrl+Tab` (Windows) / `Cmd+Shift+]` (Mac) |
| Commit WIP | `git add -A && git commit -m "WIP: desc"` |
| Push for teleport | `git push origin branch` |
| Pull after teleport | `git pull origin branch` |
| Kill stuck session | `ps aux | grep claude && kill -9 PID` |

---

## Related Resources

- [CLAUDE.md](../../CLAUDE.md) § Multi-Session Workflow
- [.claude/agents/background-runner.md](../agents/background-runner.md) - Long-running tasks
- [.claude/agents/verify-app.md](../agents/verify-app.md) - Verification patterns

---

## Changelog

- **2026-01-08:** Initial parallel sessions workflow documentation
