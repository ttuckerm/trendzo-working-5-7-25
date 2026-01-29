### Backup & Restore

- CLI: implement `scripts/backup.ts` and `scripts/restore.ts` to dump DB and configs to `/backups`.
- Schedule: run nightly via OS scheduler or CI; record artifact in `backup_meta`.
- UI: Jobs tab shows latest backup status via `[data-testid='backup-status']`.


