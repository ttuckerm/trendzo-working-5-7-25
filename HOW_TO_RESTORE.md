# How to Restore from a Checkpoint

If you need to restore the project to a previously working state, follow these steps.

## Restore to the latest working checkpoint (April 2025)

To restore the entire project to the working checkpoint created on April 15, 2025:

```bash
# View all available checkpoints/tags
git tag -l

# Restore to the working checkpoint
git checkout working-checkpoint-20250415

# Create a new branch from this checkpoint if desired
git checkout -b restored-from-checkpoint
```

## Restore specific files only

If you only want to restore specific files from the checkpoint without restoring the entire project:

```bash
# Restore a specific file
git checkout working-checkpoint-20250415 -- path/to/file.tsx

# Restore multiple files
git checkout working-checkpoint-20250415 -- src/app/components/HistoricalImpact/TimeframeSelector.tsx src/app/plain/page.jsx
```

## Checking what changed

To see what changes were made in the checkpoint:

```bash
# View the commit details
git show working-checkpoint-20250415

# Compare current state with checkpoint
git diff working-checkpoint-20250415
```

## Other available checkpoints

There are other stable versions of the application that you can restore to:

- `stable-functioning-version`
- `stable-functioning-version-2`
- `checkpoint-v1`
- `simplified-ui-fix`

Use the same commands as above, but replace `working-checkpoint-20250415` with the desired checkpoint name.

# Project Snapshot Restoration Guide (Latest - $(date))

## Current Snapshot Information

- **Date**: $(date)
- **Commit Hash**: `71beb182d572e786a6fbd657b208b11d2ebf635b`
- **Branch**: `upload-branch`

## How to Restore to This Version

If you need to restore the project to exactly this snapshot in the future, use the following Git command:

```bash
git checkout 71beb182d572e786a6fbd657b208b11d2ebf635b
```

This will put your repository in a "detached HEAD" state at the exact point of this snapshot.

If you want to create a new branch from this snapshot to work on:

```bash
git checkout -b new-branch-name 71beb182d572e786a6fbd657b208b11d2ebf635b
```

## Additional Notes

1. Make sure all your current changes are committed or stashed before restoring.
2. The cursor-memory-bank directory is included in this snapshot but may have internal git tracking.
3. After restoring, you might need to run:
   ```
   npm install
   ```
   to reinstall any node dependencies. 