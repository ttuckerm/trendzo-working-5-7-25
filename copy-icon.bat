@echo off
echo This script will help you copy your icon to the correct locations.
echo.
echo Please place your icon file in the same directory as this script.
echo.
set /p icon_file="Enter the filename of your icon (e.g. flame.png): "

if not exist "%icon_file%" (
  echo File %icon_file% not found!
  echo Make sure the file is in the same directory as this script.
  pause
  exit /b
)

echo Copying to public/favicon.ico...
copy /y "%icon_file%" "public\favicon.ico"

echo Copying to public/icon.png...
copy /y "%icon_file%" "public\icon.png"

echo.
echo Files copied successfully!
echo Please refresh your browser with a hard refresh (Ctrl+Shift+R).
pause 