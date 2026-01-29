# /commit-push-pr

Fast commit-push-PR workflow per Boris Cherny's pattern.

## Usage

```
/commit-push-pr
/commit-push-pr "Custom commit message"
```

---

## Pre-Compute (Run First)

Gather context before generating commit message:

```bash
# Current changes
git status --short

# Diff summary
git diff --stat

# Current branch
git branch --show-current

# Recent commits for style reference
git log --oneline -5
```

---

## Steps

### Step 1: Show Changes Summary

Display what will be committed:

```
============================================
CHANGES TO COMMIT
============================================
Branch: feature/xyz

Modified Files:
  M src/lib/prediction/runPredictionPipeline.ts
  M src/app/api/predict/route.ts

New Files:
  A src/lib/prediction/__tests__/new-feature.test.ts

Deleted Files:
  D src/lib/deprecated/old-code.ts

Stats: 3 files changed, +156 -23
============================================
```

### Step 2: Generate Commit Message

Use conventional commit format:

| Prefix | When to Use |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code restructure (no behavior change) |
| `test:` | Adding/updating tests |
| `chore:` | Build, deps, config changes |
| `perf:` | Performance improvement |

**Template:**
```
<type>: <brief description>

<optional body explaining why>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Examples:**
```
feat: add artifact caching for transcripts

Reduces redundant Whisper API calls by caching transcripts
based on video content hash.

Co-Authored-By: Claude <noreply@anthropic.com>
```

```
fix: handle null transcript in feature extraction

Videos without transcripts were causing NaN in word_count feature.
Now returns 0 for text metrics when transcript is null.

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Step 3: Execute Git Commands

```bash
# Stage all changes
git add -A

# Commit with message (using heredoc for multi-line)
git commit -m "$(cat <<'EOF'
<type>: <description>

<body if needed>

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to remote (create upstream if needed)
git push origin $(git branch --show-current) -u
```

### Step 4: Create Pull Request

```bash
gh pr create \
  --title "<type>: <Brief description>" \
  --body "$(cat <<'EOF'
## Summary
- <bullet point 1>
- <bullet point 2>
- <bullet point 3>

## Test Plan
- [ ] Type check passes (`npm run typecheck`)
- [ ] Tests pass (`npm run test:smoke`)
- [ ] Manual verification of [specific feature]

## Related
- Closes #<issue_number> (if applicable)

---
🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" \
  --base main
```

### Step 5: Return PR URL

```
============================================
PR CREATED SUCCESSFULLY
============================================
URL: https://github.com/[org]/[repo]/pull/[number]
Title: feat: add artifact caching for transcripts
Branch: feature/artifact-caching -> main

Next Steps:
1. Review PR at the URL above
2. Request reviews from team members
3. Address any CI failures
4. Merge when approved
============================================
```

---

## Pre-Flight Checks

Before creating PR, verify:

```bash
# Type check
npx tsc --noEmit

# Smoke tests
npm run test:smoke
```

If either fails, fix before proceeding.

---

## PR Template

```markdown
## Summary
- Brief description of what changed
- Why this change was needed
- Impact on users/system

## Test Plan
- [ ] Type check passes
- [ ] Tests pass
- [ ] Manual testing steps (if applicable)
- [ ] Smoke test endpoint works

## Screenshots
(If UI changes)

## Breaking Changes
(If any - describe migration path)

---
🤖 Generated with [Claude Code](https://claude.ai/code)
```

---

## Quick Mode

For simple changes, use one-liner:

```bash
git add -A && \
git commit -m "fix: <description>

Co-Authored-By: Claude <noreply@anthropic.com>" && \
git push origin $(git branch --show-current) -u && \
gh pr create --title "fix: <description>" --body "Quick fix" --base main
```

---

## Troubleshooting

### "Branch already has PR"
```bash
# Check existing PRs
gh pr list --head $(git branch --show-current)

# If PR exists, just push
git push
```

### "Merge conflicts"
```bash
# Rebase on main
git fetch origin
git rebase origin/main

# Resolve conflicts, then
git push --force-with-lease
```

### "CI failed"
```bash
# Check what failed
gh pr checks

# Fix locally, then push
git push
```

---

## Related Commands

- [/verify](./verify.md) - Quick verification before commit
- [/pr-checklist](./pr-checklist.md) - Full PR checklist
- [/pr-review](./pr-review.md) - Review existing PR

---

## Reference

- [CLAUDE.md](../../CLAUDE.md) § Git Commit Strategy
- [.claude/commands/pr-checklist.md](./pr-checklist.md) - Detailed PR checklist
