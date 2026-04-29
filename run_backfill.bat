@echo off
cd /d C:\Projects\CleanCopy
call npx tsx src/lib/training/backfill_fixed_features.ts > backfill_detached.log 2>&1
