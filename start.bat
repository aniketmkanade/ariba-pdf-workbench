@echo off
TITLE Ariba PDF Workbench - One-Click Launcher (Windows)
COLOR 0B

echo 🚀 Starting Ariba PDF Workbench...

REM 1. Check if Ollama is running
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Ollama is not running!
    echo Please open the Ollama application or run 'ollama serve' in another terminal.
    echo.
    pause
)

REM 2. Start the Backend Server in a new CMD window
echo 📂 Starting Backend Server (Port 3001)...
start cmd.exe /k "cd server && npm run dev"

REM 3. Open VS Code
echo 💻 Opening VS Code...
code .

echo ✅ Workbench ready! Use the 'Ariba' icon in the sidebar to begin.
pause
