#!/bin/bash
# Ariba PDF Workbench - One-Click Launcher (Mac/Linux)

echo "🚀 Starting Ariba PDF Workbench..."

# 1. Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Ollama is not running!"
    echo "Please open the Ollama application or run 'ollama serve' in another terminal."
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to stop..."
fi

# 2. Start the Backend Server in a new terminal window (Mac specific)
echo "📂 Starting Backend Server (Port 3001)..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'/server\" && npm run dev"'
else
    # Linux (assuming x-terminal-emulator)
    x-terminal-emulator -e "bash -c 'cd server && npm run dev; exec bash'" &
fi

# 3. Open VSCode
echo "💻 Opening VS Code..."
code .

echo "✅ Workbench ready! Use the 'Ariba' icon in the sidebar to begin."
