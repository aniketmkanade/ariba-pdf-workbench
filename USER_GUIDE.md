# 📘 Ariba PDF Workbench — Complete Setup & User Guide

> **Version 6.0** | Supports: macOS (Intel & Apple Silicon) · Windows 10/11
> 
> **Privacy:** 100% local processing. No data leaves your machine.

---

## 📋 Table of Contents

1. [What You Need (Prerequisites)](#1-what-you-need-prerequisites)
2. [Installation — macOS](#2-installation--macos)
3. [Installation — Windows](#3-installation--windows)
4. [Install the VSCode Extension](#4-install-the-vscode-extension)
5. [Start the Backend Server](#5-start-the-backend-server)
6. [Using the Workbench](#6-using-the-workbench)
7. [Permissions Required](#7-permissions-required)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. What You Need (Prerequisites)

Before starting, make sure you have or can install the following. All are **free**.

| Tool | Purpose | Required? |
| :--- | :--- | :--- |
| **Node.js v18+** | Runs the PDF generation server | ✅ Yes |
| **Java 8+** (JDK or JRE) | Required by Apache FOP for PDF rendering | ✅ Yes |
| **Apache FOP 2.x** | Converts XSL-FO templates into PDF files | ✅ Yes |
| **xsltproc** | Applies XSLT stylesheets to XML data | ✅ Yes |
| **Ollama** | Runs the local AI model for template generation | ✅ Yes |
| **VSCode** (1.90+) | The IDE this extension runs inside | ✅ Yes |
| **Git** | Clone the repository | ✅ Yes |

> ⚠️ **Corporate / VPN users:** Your IT team may need to whitelist `registry.npmjs.org`, `ollama.com`, and `github.com` for downloads to work. See [Section 7 – Permissions](#7-permissions-required).

---

## 2. Installation — macOS

### Step 1 — Install Homebrew (macOS package manager)

Open **Terminal** and run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> 🔐 **Permission needed:** Your Mac login password (it does NOT require admin/root — just your own password).

After it finishes, if you are on **Apple Silicon (M1/M2/M3)**, also run:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Verify it works:

```bash
brew --version
```

---

### Step 2 — Install Node.js

```bash
brew install node
```

Verify:

```bash
node --version   # Should show v18.x or higher
npm --version
```

---

### Step 3 — Install Java

```bash
brew install openjdk
```

Then link it so the system can find it:

```bash
sudo ln -sfn /opt/homebrew/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk
```

> 🔐 **Permission needed:** `sudo` (requires your Mac password).

Verify:

```bash
java -version   # Should show openjdk version 21 or similar
```

---

### Step 4 — Install Apache FOP

```bash
brew install fop
```

Verify:

```bash
fop -version   # Should show: FOP Version 2.x
```

---

### Step 5 — Install xsltproc

**xsltproc is already installed on macOS** (it ships with the OS). Verify:

```bash
xsltproc --version
```

If it is missing (rare, on minimal macOS installs):

```bash
brew install libxslt
```

---

### Step 6 — Install Ollama

Download the macOS app from: **https://ollama.com/download**

1. Open the downloaded `.dmg` file.
2. Drag `Ollama` to your Applications folder.
3. Open Ollama from Applications — you will see a small llama icon in your menu bar.

Then pull the AI model (this is a ~4GB download, only needed once):

```bash
ollama pull qwen2.5-coder:7b
```

> ⚠️ This may take 5–15 minutes depending on your internet speed. Let it finish completely.

Verify:

```bash
ollama list   # Should show qwen2.5-coder:7b
```

---

### Step 7 — Clone the Repository

```bash
git clone https://github.com/aniketmkanade/ariba-pdf-workbench.git
cd ariba-pdf-workbench
```

---

### Step 8 — Install Dependencies

```bash
# Install server dependencies
npm install --prefix server

# Install extension dependencies
npm install --prefix vscode-extension --legacy-peer-deps
```

---

### ✅ macOS Setup Complete

---

## 3. Installation — Windows

> 💡 All commands below should be run in **PowerShell** (search "PowerShell" in Start Menu). Run it as **Administrator** for Steps 1–5.

---

### Step 1 — Install Chocolatey (Windows package manager)

Open **PowerShell as Administrator** and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

> 🔐 **Permission needed:** Administrator rights on Windows.

Restart PowerShell after this. Verify:

```powershell
choco --version
```

---

### Step 2 — Install Node.js

```powershell
choco install nodejs-lts -y
```

Close and reopen PowerShell, then verify:

```powershell
node --version
npm --version
```

---

### Step 3 — Install Java

```powershell
choco install openjdk -y
```

Verify (after reopening PowerShell):

```powershell
java -version
```

---

### Step 4 — Install Apache FOP

FOP does not have a Chocolatey package, so install it manually:

1. Go to: **https://xmlgraphics.apache.org/fop/download.html**
2. Download the latest **Binary** zip (e.g. `fop-2.11-bin.zip`).
3. Extract it to `C:\fop\` so the path looks like `C:\fop\fop-2.11\`.
4. Add FOP to your system PATH:
   - Press `Win + S` → search **"Environment Variables"**.
   - Click **"Environment Variables..."**.
   - Under **System Variables**, find `Path` → click **Edit**.
   - Click **New** → type `C:\fop\fop-2.11\fop\` → click OK.
5. Restart PowerShell and verify:

```powershell
fop -version   # Should show: FOP Version 2.x
```

> 🔐 **Permission needed:** Administrator rights to edit System PATH.

---

### Step 5 — Install xsltproc

xsltproc is not built into Windows. Install it via Chocolatey:

```powershell
choco install xsltproc -y
```

Verify:

```powershell
xsltproc --version
```

If Chocolatey's version fails, use this alternative:
1. Download from: **https://www.zlatkovic.com/libxml.en.html**
2. Extract and add the folder to your system PATH (same steps as FOP above).

---

### Step 6 — Install Ollama

Download the Windows installer from: **https://ollama.com/download/windows**

1. Run the `.exe` installer (click through — it installs automatically).
2. Ollama will appear in the system tray.
3. Open **PowerShell** (normal, not admin) and run:

```powershell
ollama pull qwen2.5-coder:7b
```

> ⚠️ This is a ~4GB download. Let it finish completely before proceeding.

Verify:

```powershell
ollama list
```

---

### Step 7 — Install Git

```powershell
choco install git -y
```

Restart PowerShell, then clone the repo:

```powershell
git clone https://github.com/aniketmkanade/ariba-pdf-workbench.git
cd ariba-pdf-workbench
```

---

### Step 8 — Install Dependencies

```powershell
npm install --prefix server
npm install --prefix vscode-extension --legacy-peer-deps
```

---

### ✅ Windows Setup Complete

---

## 4. Install the VSCode Extension

### Option A — Developer Mode (Recommended for developers)

1. Open VSCode.
2. Select **File → Open Folder** → choose the `ariba-pdf-workbench` folder.
3. Press **`F5`** — this launches the Extension Development Host with the extension active.

### Option B — Install from pre-built `.vsix` (Recommended for non-developers)

1. Go to the GitHub Releases page: **https://github.com/aniketmkanade/ariba-pdf-workbench/releases**
2. Download the latest `ariba-pdf-preview-x.x.x.vsix` file.
3. In VSCode: Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) → type **"Install from VSIX"** → select the downloaded file.
4. Restart VSCode when prompted.

---

## 5. Start the Backend Server

The backend server must be running for PDF generation and AI to work.

**macOS:**

```bash
cd ariba-pdf-workbench/server
npm run dev
```

**Windows (PowerShell):**

```powershell
cd ariba-pdf-workbench\server
npm run dev
```

You should see:

```
🚀 Ariba PDF Server running on http://localhost:3001
```

> ⚠️ **Keep this terminal open** while using the extension. If you close it, the preview will stop working.

> 💡 **Port conflict?** If port 3001 is already in use, edit `server/src/index.ts` and change the PORT value, then also update the `PORT` constant in `vscode-extension/src/extension.ts` to match.

---

## 6. Using the Workbench

### 6.1 Open a Template

1. In VSCode, open any `.xsl` or `.xslt` file from `server/samples/templates/`.
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows).
3. Type **"Ariba: Open Live PDF Preview"** and press Enter.

A live PDF preview panel opens on the right. It updates automatically as you edit.

---

### 6.2 Select Your Data (ASN / HU / PO)

1. Click the **Ariba PDF icon** in the Activity Bar (left sidebar).
2. Under **Data Explorer (XML)**, you will see:
   - `asn.xml` — Advance Shipping Notice
   - `hu.xml` — Handling Unit Hierarchy
   - `po.xml` — Purchase Order
3. Click any file to load it as the active data source.
4. To use your own XML: click the **`+` (Add)** button to upload.

---

### 6.3 Use the AI Assistant

1. Make sure **Ollama is running** (you should see the llama icon in your menu bar / system tray).
2. In VSCode, open the **Copilot Chat panel** (`Ctrl+Alt+I` or `Cmd+Alt+I`).
3. Type `@ariba` followed by your request:

```
@ariba make the table header dark blue and add the company logo placeholder
@ariba add a tax calculation row at the bottom of the PO table
@ariba show the HU hierarchy with nested indented blocks
```

4. Click **"Apply Optimized Layout"** to apply the generated template.

> 💡 The AI automatically detects whether you are working on an ASN, HU, or PO document and adjusts its guidance accordingly.

---

### 6.4 Export the Final PDF

- Click the **💾 Save icon** in the editor toolbar (visible when preview is open).
- Choose a save location.
- The PDF is saved to your chosen folder.

### 6.5 Finalize & Clean Up

- Click the **✔ Checkmark icon** in the editor toolbar.
- Select an output folder.
- The extension saves both your `.xsl` template and the final `.pdf` and clears temporary workspace files.

---

## 7. Permissions Required

This is a full list of every permission the tool needs. Nothing runs without your knowledge.

### macOS

| Permission | When | Why |
| :--- | :--- | :--- |
| **Your login password** | During Homebrew install | Homebrew needs to write to `/usr/local` or `/opt/homebrew` |
| **`sudo` (your password again)** | Linking Java | Writes a symlink to `/Library/Java/JavaVirtualMachines/` |
| **Network access** | During setup only | Downloading Homebrew, Node.js, FOP, Ollama, model (~4GB) |
| **Local port 3001** | While server runs | The backend server listens on `localhost:3001` — local only, not exposed to internet |
| **Filesystem read/write** | Normal use | Reading XML/XSLT files, writing temporary files to `/tmp/`, writing exported PDFs |
| **No admin/root during normal use** | — | Once setup is done, everything runs as your normal user |

### Windows

| Permission | When | Why |
| :--- | :--- | :--- |
| **Administrator (PowerShell)** | During Chocolatey, Node.js, Java install | Windows requires admin to install software and modify system PATH |
| **UAC prompt** | FOP PATH edit | Editing System Environment Variables requires admin |
| **Network access** | During setup only | Downloading packages and Ollama model (~4GB) |
| **Windows Firewall prompt** | First time server starts | Node.js will ask if it can use port 3001 locally — click **"Allow"** |
| **No admin during normal use** | — | Once setup is done, runs as a normal user |

### Corporate / Managed Machines

If your machine is managed by IT, you may need the following whitelisted:

| What to Whitelist | Used For |
| :--- | :--- |
| `registry.npmjs.org` | npm package downloads |
| `ollama.com` | Ollama app and model downloads |
| `github.com` / `raw.githubusercontent.com` | Repository clone and Homebrew |
| `xmlgraphics.apache.org` | Apache FOP download (Windows) |
| `localhost:3001` | Internal server (already local, but some endpoint protection tools block it) |

> 🔐 All AI processing happens **100% locally** via Ollama. No XML data, templates, or documents are sent to any external server.

---

## 8. Troubleshooting

### ❌ "Preview panel shows nothing"

**Cause:** Backend server is not running.  
**Fix:** Open a terminal, navigate to the `server/` folder, and run `npm run dev`. Keep it open.

---

### ❌ "Apache FOP not found" error

**Mac fix:**
```bash
brew install fop
```
Then restart VSCode and the server.

**Windows fix:** Check that `C:\fop\fop-2.11\fop\` is correctly added to your system PATH as described in Step 4. Run `fop -version` in a fresh PowerShell window to verify.

---

### ❌ "Ollama is not running" in @ariba chat

**Mac fix:** Open the Ollama application from your Applications folder. Look for the llama 🦙 icon in the menu bar.

**Windows fix:** Find Ollama in the Start Menu and launch it. Look for the llama icon in the system tray (bottom-right of taskbar).

---

### ❌ "Model not found" / "qwen2.5-coder:7b not found"

The AI model wasn't downloaded. Run:

```bash
ollama pull qwen2.5-coder:7b
```

This requires ~4GB of disk space and a stable internet connection.

---

### ❌ `npm install` fails with `ERESOLVE` error

Run with the legacy flag:

```bash
npm install --legacy-peer-deps
```

---

### ❌ `xsltproc: command not found` on Windows

Chocolatey's xsltproc package can sometimes fail. Alternative:

1. Download the binary package from: https://www.zlatkovic.com/libxml.en.html
2. Download: `libxml2`, `libxslt`, `iconv`, `zlib` (all need to match 32-bit or 64-bit).
3. Extract all to `C:\xsltproc\`.
4. Add `C:\xsltproc\` to your system PATH.
5. Run `xsltproc --version` to verify.

---

### ❌ Port 3001 already in use

Find and stop what's using it:

**Mac:**
```bash
lsof -i :3001
kill -9 <PID>
```

**Windows (PowerShell):**
```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

### ❌ `F5` in VSCode does nothing / Extension not loading

Make sure you have the extension dependencies installed:

```bash
npm install --prefix vscode-extension --legacy-peer-deps
```

Then open the folder in VSCode and press `F5`. If prompted, select **"VS Code Extension Development"**.

---

### ❌ Java not found when running FOP

**Mac:**
```bash
brew install openjdk
sudo ln -sfn /opt/homebrew/opt/openjdk/libexec/openjdk.jdk /Library/Java/JavaVirtualMachines/openjdk.jdk
```

**Windows:**
```powershell
choco install openjdk -y
```

Then restart your terminal and verify with `java -version`.

---

## ✅ Quick-Start Checklist

Use this before every session to make sure everything is ready:

- [ ] Ollama application is open (llama icon visible in menu bar / system tray)
- [ ] Backend server is running (`npm run dev` in `server/` folder, shows port 3001)
- [ ] VSCode is open with the `ariba-pdf-workbench` folder
- [ ] An `.xsl` template is open in the editor
- [ ] A data file is selected in the Ariba PDF sidebar (ASN / HU / PO)

---

*For issues not covered here, open a GitHub issue at: https://github.com/aniketmkanade/ariba-pdf-workbench/issues*
