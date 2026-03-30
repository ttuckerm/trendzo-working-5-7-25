@echo off
echo.
echo ========================================
echo   FFMPEG INTEGRATION VISUAL TEST SUITE
echo ========================================
echo.

echo [1/3] Testing FFmpeg Service...
echo.
call npx tsx scripts/test-ffmpeg-service.ts
if %errorlevel% neq 0 (
    echo.
    echo ❌ FFmpeg Service test failed!
    pause
    exit /b 1
)

echo.
echo.
echo [2/3] Testing Visual Intelligence Scoring...
echo.
call npx tsx scripts/test-visual-intelligence.ts
if %errorlevel% neq 0 (
    echo.
    echo ❌ Visual Intelligence test failed!
    pause
    exit /b 1
)

echo.
echo.
echo [3/3] Testing Database Integration...
echo.
set NEXT_PUBLIC_SUPABASE_URL=https://vyeiyccrageeckeehyhj.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlZWNrZWVoeWhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjkyMTYxMSwiZXhwIjoyMDYyNDk3NjExfQ.A-AngxU0Y6bEdTE-gDVoh9xRypol0C474LEgRKR8bE8
call npx tsx scripts/test-database-integration.ts
if %errorlevel% neq 0 (
    echo.
    echo ❌ Database Integration test failed!
    pause
    exit /b 1
)

echo.
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     ✅ ALL TESTS PASSED!                                   ║
echo ║                                                            ║
echo ║     FFmpeg integration is working perfectly!               ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
pause
