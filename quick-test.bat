@echo off
REM Quick FFmpeg Visual Test - Analyzes a sample video and shows the score

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     QUICK FFMPEG VISUAL TEST                               ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo This will analyze a test video and show you the visual intelligence score.
echo.

npx tsx scripts/analyze-one-video.ts https://www.w3schools.com/html/mov_bbb.mp4

echo.
pause
