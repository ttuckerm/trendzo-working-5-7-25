@echo off
REM Load environment variables and run FFmpeg test

echo Loading environment variables...

REM Load .env.local file
for /f "usebackq tokens=1,* delims==" %%a in (".env.local") do (
    set "%%a=%%b"
)

echo Running FFmpeg test...
npx tsx scripts/test-ffmpeg-single.ts

pause
