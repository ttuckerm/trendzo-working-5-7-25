@echo off
REM TikTok Pipeline Status Checker
REM Quick check of how many videos you have and how many need transcripts

cd /d C:\Projects\CleanCopy

set SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8
set SUPABASE_SERVICE_ROLE_KEY=%SERVICE_ROLE_KEY%
set SUPABASE_URL=https://vyeiyccrageeckeehyhj.supabase.co
set PROJECT_URL=%SUPABASE_URL%

python scripts/check-pipeline-status.py

pause

