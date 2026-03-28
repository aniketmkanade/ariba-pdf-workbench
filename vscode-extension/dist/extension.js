"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const util_1 = require("util");
const path = __importStar(require("path"));
const child_process = __importStar(require("child_process"));
const snippets_1 = require("./snippets");
let currentPanel;
let debounceTimeout;
let currentXmlUri;
let serverProcess;
const PORT = 3001;
const API_URL = `http://localhost:${PORT}/api/preview`;
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const SAMPLE_XML = `<PurchaseOrder orderID="PO-12345" orderDate="2023-10-27" currency="USD">
  <Supplier><Name>Acme Corp</Name></Supplier>
  <Buyer><Name>Global Industries</Name></Buyer>
  <LineItems>
    <LineItem lineNumber="1">
      <Description>Widget A</Description>
      <Quantity unit="EA">100</Quantity>
      <UnitPrice>10.50</UnitPrice>
    </LineItem>
  </LineItems>
</PurchaseOrder>`;
function activate(context) {
    console.log('Ariba PDF Elite Extension Active!');
    startBackendServer(context);
    const samplesPath = path.join(context.extensionPath, '..', 'server', 'samples');
    const inputsPath = path.join(samplesPath, 'inputs');
    const sampleProvider = new AribaSampleProvider(inputsPath);
    vscode.window.registerTreeDataProvider('ariba-pdf-samples', sampleProvider);
    const snippetProvider = new snippets_1.AribaSnippetProvider();
    vscode.window.registerTreeDataProvider('ariba-pdf-snippets', snippetProvider);
    // --- AI Chat Logic ---
    const aribaChat = vscode.chat.createChatParticipant('ariba-pdf-preview.ariba', async (request, context, response, token) => {
        const userPrompt = request.prompt;
        let systemInstruction = `You are the Ariba PDF Expert. You generate high-quality XSL-FO 1.1.`;
        if (request.command === 'table') {
            systemInstruction += ` Focus on generating a professional <fo:table> with headers and dynamic xsl:for-each rows.`;
            response.progress('Designing your professional FO table...');
        }
        try {
            const res = await axios_1.default.post(OLLAMA_URL, {
                model: 'mistral',
                prompt: `${systemInstruction}\nUser: ${userPrompt}\nAssistant:`,
                stream: false
            });
            response.markdown(res.data.response);
            response.button({ command: 'ariba-pdf-preview.applyXslt', title: 'Apply Proposed Layout', arguments: [res.data.response] });
        }
        catch (err) {
            response.markdown(`❌ AI Service Offline. Ensure Ollama is running.`);
        }
    });
    // --- Core Commands ---
    let openPreviewCmd = vscode.commands.registerCommand('ariba-pdf-preview.openPreview', () => {
        if (currentPanel) {
            currentPanel.reveal(vscode.ViewColumn.Beside);
        }
        else {
            currentPanel = vscode.window.createWebviewPanel('pdfPreview', 'Ariba PDF Workbench', vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
            currentPanel.onDidDispose(() => { currentPanel = undefined; vscode.commands.executeCommand('setContext', 'pdfPreviewActive', false); });
            vscode.commands.executeCommand('setContext', 'pdfPreviewActive', true);
            currentPanel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'refresh':
                        triggerPreviewUpdate();
                        return;
                    case 'export':
                        vscode.commands.executeCommand('ariba-pdf-preview.exportPdf');
                        return;
                    case 'view-external':
                        vscode.commands.executeCommand('ariba-pdf-preview.viewExternal');
                        return;
                }
            });
            triggerPreviewUpdate();
        }
    });
    let viewExternalCmd = vscode.commands.registerCommand('ariba-pdf-preview.viewExternal', async () => {
        if (!currentPanel)
            return;
        const tempPdfUri = vscode.Uri.file(path.join(context.extensionPath, 'vsc-temp-preview.pdf'));
        await performExport(tempPdfUri);
        await vscode.env.openExternal(tempPdfUri);
    });
    let exportPdfCmd = vscode.commands.registerCommand('ariba-pdf-preview.exportPdf', async () => {
        const saveUri = await vscode.window.showSaveDialog({ filters: { 'PDF files': ['pdf'] }, defaultUri: vscode.Uri.file(path.join(samplesPath, 'outputs', 'invoice-output.pdf')) });
        if (saveUri)
            await performExport(saveUri);
    });
    let refreshSamplesCmd = vscode.commands.registerCommand('ariba-pdf-preview.refreshSamples', () => {
        sampleProvider.refresh();
    });
    let uploadXmlCmd = vscode.commands.registerCommand('ariba-pdf-preview.uploadXml', async () => {
        const uris = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { 'XML files': ['xml'] } });
        if (uris && uris.length > 0) {
            const dest = vscode.Uri.file(path.join(inputsPath, path.basename(uris[0].fsPath)));
            await vscode.workspace.fs.copy(uris[0], dest, { overwrite: true });
            sampleProvider.refresh();
        }
    });
    let finalizeTaskCmd = vscode.commands.registerCommand('ariba-pdf-preview.finalizeTask', async () => {
        const folderUri = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true });
        if (folderUri && folderUri.length > 0) {
            const baseDir = folderUri[0];
            await performExport(vscode.Uri.file(path.join(baseDir.fsPath, 'final_document.pdf')));
            vscode.window.showInformationMessage('Task Finalized and Results Exported.');
        }
    });
    let resetWorkspaceCmd = vscode.commands.registerCommand('ariba-pdf-preview.resetWorkspace', async () => {
        const confirm = await vscode.window.showWarningMessage('Reset all current task data?', { modal: true }, 'Yes');
        if (confirm === 'Yes') {
            currentXmlUri = undefined;
            sampleProvider.refresh();
            if (currentPanel)
                currentPanel.dispose();
        }
    });
    // --- Utility Commands ---
    let insertSnippetCmd = vscode.commands.registerCommand('ariba-pdf-preview.insertSnippet', (snippet) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor)
            activeEditor.insertSnippet(new vscode.SnippetString(snippet));
    });
    let insertXPathCmd = vscode.commands.registerCommand('ariba-pdf-preview.insertXPath', (xpath) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor)
            activeEditor.insertSnippet(new vscode.SnippetString(`<xsl:value-of select="${xpath}"/>`));
    });
    let applyXsltCmd = vscode.commands.registerCommand('ariba-pdf-preview.applyXslt', async (newXslt) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(activeEditor.document.uri, new vscode.Range(0, 0, activeEditor.document.lineCount, 0), newXslt);
            await vscode.workspace.applyEdit(edit);
        }
    });
    let openSampleCmd = vscode.commands.registerCommand('ariba-pdf-preview.openSample', (uri) => {
        currentXmlUri = uri;
        if (currentPanel)
            triggerPreviewUpdate();
    });
    context.subscriptions.push(openPreviewCmd, viewExternalCmd, exportPdfCmd, refreshSamplesCmd, uploadXmlCmd, finalizeTaskCmd, resetWorkspaceCmd, insertSnippetCmd, insertXPathCmd, applyXsltCmd, openSampleCmd);
    // Status monitoring
    vscode.workspace.onDidChangeTextDocument(e => { if (currentPanel && isRelevant(e.document))
        triggerPreviewUpdate(); });
    vscode.window.onDidChangeActiveTextEditor(e => { if (currentPanel && e && isRelevant(e.document))
        triggerPreviewUpdate(); });
}
// --- Helpers ---
async function performExport(uri) {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor)
        return;
    const xsltContent = activeEditor.document.getText();
    let xmlContent = SAMPLE_XML;
    if (currentXmlUri) {
        const data = await vscode.workspace.fs.readFile(currentXmlUri);
        xmlContent = new util_1.TextDecoder().decode(data);
    }
    try {
        const res = await axios_1.default.post(API_URL, { xml: xmlContent, xslt: xsltContent }, { responseType: 'arraybuffer' });
        await vscode.workspace.fs.writeFile(uri, Buffer.from(res.data));
    }
    catch (err) {
        vscode.window.showErrorMessage(`Export failed: ${err.message}`);
    }
}
function triggerPreviewUpdate() {
    if (debounceTimeout)
        clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(async () => {
        if (!currentPanel)
            return;
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor)
            return;
        const xsltContent = activeEditor.document.getText();
        let xmlContent = SAMPLE_XML;
        if (currentXmlUri) {
            try {
                const data = await vscode.workspace.fs.readFile(currentXmlUri);
                xmlContent = new util_1.TextDecoder().decode(data);
            }
            catch (e) {
                console.error('Failed to read XML');
            }
        }
        try {
            const res = await axios_1.default.post(API_URL, { xml: xmlContent, xslt: xsltContent }, { responseType: 'arraybuffer' });
            const dataUri = `data:application/pdf;base64,${Buffer.from(res.data).toString('base64')}`;
            currentPanel.webview.html = getWebviewContent(currentPanel.webview, dataUri);
        }
        catch (e) {
            console.error('Preview failed');
        }
    }, 800);
}
function isRelevant(doc) { return doc.languageId === 'xsl' || doc.fileName.endsWith('.xsl'); }
function startBackendServer(context) {
    const serverPath = path.join(context.extensionPath, '..', 'server', 'dist', 'index.js');
    serverProcess = child_process.spawn('node', [serverPath], { env: { ...process.env, PORT: PORT.toString() } });
}
function getWebviewContent(webview, pdfUri) {
    const xmlName = currentXmlUri ? path.basename(currentXmlUri.fsPath) : 'SAMPLE_DATA';
    return `<!DOCTYPE html><html lang="en"><head>
  <style>
    :root { --bg: #1e1e1e; --side: #252526; --accent: #007acc; --border: #444; --text: #cccccc; }
    body { margin: 0; padding: 0; width: 100vw; height: 100vh; background: var(--bg); color: var(--text); font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; }
    .status { height: 24px; background: var(--accent); color: white; display: flex; align-items: center; padding: 0 12px; font-size: 11px; gap: 12px; }
    .toolbar { height: 40px; background: var(--side); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; gap: 8px; }
    .spacer { flex: 1; }
    .btn { background: #3c3c3c; border: 1px solid var(--border); color: white; padding: 4px 12px; border-radius: 2px; font-size: 11px; cursor: pointer; border: none; }
    .btn:hover { background: #505050; }
    .btn.primary { background: var(--accent); color: white; }
    .preview { flex: 1; background: #525659; }
    iframe { width: 100%; height: 100%; border: none; }
  </style></head><body>
  <div class="toolbar">
    <div style="font-weight: bold; font-size: 12px; color: var(--accent);">ARIBA WORKBENCH v5.0</div>
    <div style="background: #2d2d2d; border-radius: 4px; padding: 2px 8px; font-size: 9px; border: 1px solid var(--border); margin-left: 12px;">DATA: ${xmlName}</div>
    <div class="spacer"></div>
    <button class="btn" onclick="vscode.postMessage({command:'view-external'})">Open in Browser</button>
    <button class="btn" onclick="vscode.postMessage({command:'export'})">Download PDF</button>
    <button class="btn primary" onclick="vscode.postMessage({command:'refresh'})">Sync Now</button>
  </div>
  <div class="preview"><iframe src="${pdfUri}"></iframe></div>
  <div class="status">
    <span>CONNECTED: Ariba Elite Engine</span>
    <span style="opacity: 0.6; margin-left: auto;">UTF-8 | PDF/X-1.1</span>
  </div>
  <script>const vscode = acquireVsCodeApi();</script>
</body></html>`;
}
class AribaSampleProvider {
    path;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(path) {
        this.path = path;
    }
    refresh() { this._onDidChangeTreeData.fire(); }
    getTreeItem(element) { return element; }
    async getChildren(element) {
        if (!element) {
            try {
                const result = await vscode.workspace.fs.readDirectory(vscode.Uri.file(this.path));
                return result.filter(([name]) => name.endsWith('.xml')).map(([name]) => {
                    const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.None);
                    item.iconPath = new vscode.ThemeIcon('database');
                    item.command = { command: 'ariba-pdf-preview.openSample', title: 'Open', arguments: [vscode.Uri.file(path.join(this.path, name))] };
                    return item;
                });
            }
            catch (e) {
                return [];
            }
        }
        return [];
    }
}
function deactivate() { if (serverProcess)
    serverProcess.kill(); }
//# sourceMappingURL=extension.js.map