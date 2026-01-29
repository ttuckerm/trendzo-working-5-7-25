@echo off
echo Installing AI SDK packages...

:: Install OpenAI SDK
call npm install openai@^4.28.0

:: Install Anthropic SDK
call npm install @anthropic-ai/sdk@^0.10.0

:: Install UUID package (if not already installed)
call npm install uuid@^9.0.0

:: Install types for UUID (if not already installed)
call npm install --save-dev @types/uuid

echo.
echo AI SDK packages installed successfully!
echo Please rebuild and restart your application to apply these changes.
pause 