import * as vscode from 'vscode';
import axios, { CancelTokenSource } from 'axios';
import { TextDecoder } from 'util';
import * as path from 'path';
import * as child_process from 'child_process';
import { XMLParser } from 'fast-xml-parser';
import { AribaSnippetProvider } from './snippets';

let currentPanel: vscode.WebviewPanel | undefined;
let debounceTimeout: NodeJS.Timeout | undefined;
let currentXmlUri: vscode.Uri | undefined;
let serverProcess: child_process.ChildProcess | undefined;

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

export function activate(context: vscode.ExtensionContext) {
  console.log('Ariba PDF Elite Extension Active!');

  startBackendServer(context);

  const samplesPath = path.join(context.extensionPath, '..', 'server', 'samples');
  const inputsPath = path.join(samplesPath, 'inputs');
  
  const sampleProvider = new AribaSampleProvider(inputsPath);
  vscode.window.registerTreeDataProvider('ariba-pdf-samples', sampleProvider);

  const snippetProvider = new AribaSnippetProvider();
  vscode.window.registerTreeDataProvider('ariba-pdf-snippets', snippetProvider);

  // --- AI Chat Logic ---
  const aribaChat = vscode.chat.createChatParticipant('ariba-pdf-preview.ariba', async (request, context, response, token) => {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || !isRelevant(activeEditor.document)) {
        response.markdown('❌ Please focus an XSLT file to use the AI assistant.');
        return;
    }

    const xslt = activeEditor.document.getText();
    let xml = SAMPLE_XML;
    if (currentXmlUri) {
        const data = await vscode.workspace.fs.readFile(currentXmlUri);
        xml = new TextDecoder().decode(data);
    }

    const userPrompt = request.prompt;
    response.progress('Ariba PDF AI is analyzing your template and data...');

    const history: any[] = [];
    for (const msg of context.history) {
        if ('prompt' in msg) {
            history.push({ role: 'user', content: (msg as any).prompt });
        } else if ('response' in msg) {
            const content = (msg as any).response.map((r: any) => r.value?.value || r.value || '').join('\n');
            history.push({ role: 'assistant', content });
        }
    }

    try {
      const res = await axios.post(`http://localhost:${PORT}/api/ai/chat`, {
        prompt: userPrompt,
        xslt,
        xml,
        history
      });
      
      const { xslt: newXslt, message, diffs, fullText } = res.data;
      response.markdown(`${message}\n\n`);
      response.button({ 
        command: 'ariba-pdf-preview.applyXslt', 
        title: 'Apply Optimized Layout', 
        arguments: [{ newXslt, diffs, fullText }] 
      });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      response.markdown(`❌ AI Assistant Error: ${msg}\n\nEnsure the Ariba PDF server is running and Ollama is active.`);
    }
  });

  // --- Core Commands ---
  let openPreviewCmd = vscode.commands.registerCommand('ariba-pdf-preview.openPreview', () => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Beside);
    } else {
      currentPanel = vscode.window.createWebviewPanel('pdfPreview', 'Ariba PDF Workbench', vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
      currentPanel.onDidDispose(() => { currentPanel = undefined; vscode.commands.executeCommand('setContext', 'pdfPreviewActive', false); });
      vscode.commands.executeCommand('setContext', 'pdfPreviewActive', true);

      currentPanel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case 'refresh': triggerPreviewUpdate(); return;
          case 'export': vscode.commands.executeCommand('ariba-pdf-preview.exportPdf'); return;
          case 'view-external': vscode.commands.executeCommand('ariba-pdf-preview.viewExternal'); return;
        }
      });
      triggerPreviewUpdate();
    }
  });

  let viewExternalCmd = vscode.commands.registerCommand('ariba-pdf-preview.viewExternal', async () => {
    if (!currentPanel) return;
    const tempPdfUri = vscode.Uri.file(path.join(context.extensionPath, 'vsc-temp-preview.pdf'));
    await performExport(tempPdfUri);
    await vscode.env.openExternal(tempPdfUri);
  });

  let exportPdfCmd = vscode.commands.registerCommand('ariba-pdf-preview.exportPdf', async () => {
    const saveUri = await vscode.window.showSaveDialog({ filters: { 'PDF files': ['pdf'] }, defaultUri: vscode.Uri.file(path.join(samplesPath, 'outputs', 'invoice-output.pdf')) });
    if (saveUri) await performExport(saveUri);
  });

  let refreshSamplesCmd = vscode.commands.registerCommand('ariba-pdf-preview.refreshSamples', () => {
    sampleProvider.refresh();
  });

  let uploadXmlCmd = vscode.commands.registerCommand('ariba-pdf-preview.uploadXml', async () => {
    const uris = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { 'XML files': ['xml'] } });
    if (uris && uris.length > 0) {
      const dest = vscode.Uri.file(path.join(inputsPath, path.basename(uris[0].fsPath)));
      if (uris[0].fsPath === dest.fsPath) {
          vscode.window.showInformationMessage('File is already in the inputs directory.');
          return;
      }

      try {
          const data = await vscode.workspace.fs.readFile(uris[0]);
          const xmlContent = new TextDecoder().decode(data);
          const valRes = await axios.post(`http://localhost:${PORT}/api/validate`, { xml: xmlContent });
          if (!valRes.data.valid) {
              const errors = valRes.data.errors?.join('\n') || 'Unknown error';
              const schemaMsg = valRes.data.schemaApplied ? 'Strict Schema Validation Failed' : 'XML Parsing Failed';
              const proceed = await vscode.window.showWarningMessage(`${schemaMsg}: ${errors.substring(0, 300)}...\n\nDo you still want to upload?`, { modal: true }, 'Yes', 'No');
              if (proceed !== 'Yes') return;
          } else if (valRes.data.schemaApplied) {
              vscode.window.showInformationMessage('XML passed strict schema validation! ✅');
          }
      } catch (err: any) {
          console.error('Validation request failed', err);
      }

      try {
          await vscode.workspace.fs.stat(dest);
          const confirm = await vscode.window.showWarningMessage('File already exists in inputs directory. Overwrite?', { modal: true }, 'Yes');
          if (confirm !== 'Yes') return;
      } catch {
          // file not there
      }
      await vscode.workspace.fs.copy(uris[0], dest, { overwrite: true });
      sampleProvider.refresh();
    }
  });

  let finalizeTaskCmd = vscode.commands.registerCommand('ariba-pdf-preview.finalizeTask', async () => {
    const folderUri = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true });
    if (folderUri && folderUri.length > 0) {
        const baseDir = folderUri[0];
        const targetUri = vscode.Uri.file(path.join(baseDir.fsPath, 'final_document.pdf'));
        try {
            await vscode.workspace.fs.stat(targetUri);
            const confirm = await vscode.window.showWarningMessage('final_document.pdf already exists. Overwrite?', { modal: true }, 'Yes');
            if (confirm !== 'Yes') return;
        } catch {
            // file does not exist
        }
        await performExport(targetUri);
        vscode.window.showInformationMessage('Task Finalized and Results Exported.');
    }
  });

  let resetWorkspaceCmd = vscode.commands.registerCommand('ariba-pdf-preview.resetWorkspace', async () => {
    const confirm = await vscode.window.showWarningMessage('Reset all current task data?', { modal: true }, 'Yes');
    if (confirm === 'Yes') {
        currentXmlUri = undefined;
        sampleProvider.refresh();
        if (currentPanel) currentPanel.dispose();
    }
  });

  // --- Utility Commands ---
  let insertSnippetCmd = vscode.commands.registerCommand('ariba-pdf-preview.insertSnippet', (snippet: string) => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && isRelevant(activeEditor.document)) {
        activeEditor.insertSnippet(new vscode.SnippetString(snippet));
    } else {
        vscode.window.showErrorMessage('Snippets can only be inserted into XSLT files.');
    }
  });

  let insertXPathCmd = vscode.commands.registerCommand('ariba-pdf-preview.insertXPath', (xpath: string) => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && isRelevant(activeEditor.document)) {
        activeEditor.insertSnippet(new vscode.SnippetString(`<xsl:value-of select="${xpath}"/>`));
    } else {
        vscode.window.showErrorMessage('XPath can only be inserted into XSLT files.');
    }
  });

  let applyXsltCmd = vscode.commands.registerCommand('ariba-pdf-preview.applyXslt', async (payload: any) => {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && isRelevant(activeEditor.document)) {
      const edit = new vscode.WorkspaceEdit();
      const document = activeEditor.document;

      // FIX 2 & 3: Normalize line endings and get full text with safe bounds
      const rawText = document.getText();
      const text = rawText.replace(/\r\n/g, '\n');
      const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(rawText.length));

      if (typeof payload === 'string') {
          // Backward compatibility — direct string overwrite
          edit.replace(document.uri, fullRange, payload);
      } else if (payload.fullText || !payload.diffs || payload.diffs.length === 0) {
          // Full replacement override from AI fallback (FIX 3 applied)
          edit.replace(document.uri, fullRange, payload.newXslt);
      } else {
          // FIX 1 & 2: Diff application with ambiguity guard and line-ending normalization
          let missingDiffs = 0;
          let ambiguousDiffs = 0;
          
          // Helper to map normalized index back to rawText offset
          const getRealOffset = (normalizedTarget: number): number => {
              let currentNormalized = 0;
              let currentRaw = 0;
              while (currentNormalized < normalizedTarget && currentRaw < rawText.length) {
                  if (rawText[currentRaw] !== '\r') {
                      currentNormalized++;
                  }
                  currentRaw++;
              }
              // Skip any trailing \r before the target character if it landed on one
              while (currentRaw < rawText.length && rawText[currentRaw] === '\r') {
                  currentRaw++;
              }
              return currentRaw;
          };

          for (const diff of payload.diffs) {
              const normalizedSearch = diff.search.replace(/\r\n/g, '\n');
              const normalizedReplace = diff.replace.replace(/\r\n/g, '\n');

              let occurrences = 0;
              let pos = 0;
              while ((pos = text.indexOf(normalizedSearch, pos)) !== -1) {
                  occurrences++;
                  pos++;
              }

              if (occurrences === 0) {
                  missingDiffs++;
              } else if (occurrences > 1) {
                  ambiguousDiffs++;
              } else {
                  const normalizedIndex = text.indexOf(normalizedSearch);
                  const startOffset = getRealOffset(normalizedIndex);
                  const endOffset = getRealOffset(normalizedIndex + normalizedSearch.length);
                  
                  edit.replace(document.uri, new vscode.Range(document.positionAt(startOffset), document.positionAt(endOffset)), normalizedReplace);
              }
          }
          
          if (ambiguousDiffs > 0) {
              vscode.window.showWarningMessage(
                `AI generated ${ambiguousDiffs} ambiguous patch(es). Those patches were skipped to avoid errors. Try being more specific in your prompt.`
              );
          }
          if (missingDiffs > 0) {
              vscode.window.showWarningMessage(`Could not find ${missingDiffs} patch location(s). The document may have changed.`);
          }
      }
      
      await vscode.workspace.applyEdit(edit);
    } else {
        vscode.window.showErrorMessage('Cannot apply XSLT. Please focus an active XSLT file.');
    }
  });

  let openSampleCmd = vscode.commands.registerCommand('ariba-pdf-preview.openSample', (uri: vscode.Uri) => {
    currentXmlUri = uri;
    if (currentPanel) triggerPreviewUpdate();
  });

  context.subscriptions.push(
    openPreviewCmd, viewExternalCmd, exportPdfCmd, refreshSamplesCmd, 
    uploadXmlCmd, finalizeTaskCmd, resetWorkspaceCmd, 
    insertSnippetCmd, insertXPathCmd, applyXsltCmd, openSampleCmd
  );

  // Status monitoring
  vscode.workspace.onDidChangeTextDocument(e => { if (currentPanel && isRelevant(e.document)) triggerPreviewUpdate(); });
  vscode.window.onDidChangeActiveTextEditor(e => { if (currentPanel && e && isRelevant(e.document)) triggerPreviewUpdate(); });
}

// --- Helpers ---
async function performExport(uri: vscode.Uri): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor || !isRelevant(activeEditor.document)) {
      vscode.window.showErrorMessage('Please focus an XSLT file to export.');
      return;
  }
  const xsltContent = activeEditor.document.getText();
  let xmlContent = SAMPLE_XML;
  if (currentXmlUri) {
    const data = await vscode.workspace.fs.readFile(currentXmlUri);
    xmlContent = new TextDecoder().decode(data);
  }
  try {
    const res = await axios.post(API_URL, { xml: xmlContent, xslt: xsltContent }, { responseType: 'arraybuffer' });
    await vscode.workspace.fs.writeFile(uri, Buffer.from(res.data));
  } catch (err: any) {
    vscode.window.showErrorMessage(`Export failed: ${err.message}`);
  }
}

let cancelTokenSource: CancelTokenSource | undefined;

function triggerPreviewUpdate() {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  if (cancelTokenSource) {
      cancelTokenSource.cancel('User is still typing; superseded by new preview request.');
  }
  debounceTimeout = setTimeout(async () => {
    if (!currentPanel) return;
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) return;
    const xsltContent = activeEditor.document.getText();
    let xmlContent = SAMPLE_XML;
    if (currentXmlUri) {
        try {
            const data = await vscode.workspace.fs.readFile(currentXmlUri);
            xmlContent = new TextDecoder().decode(data);
        } catch (e) { console.error('Failed to read XML'); }
    }
    
    cancelTokenSource = axios.CancelToken.source();
    try {
      const res = await axios.post(API_URL, { xml: xmlContent, xslt: xsltContent }, { 
          responseType: 'arraybuffer',
          cancelToken: cancelTokenSource.token
      });
      const dataUri = `data:application/pdf;base64,${Buffer.from(res.data).toString('base64')}`;
      currentPanel.webview.html = getWebviewContent(currentPanel.webview, dataUri);
    } catch (e: any) {
      if (axios.isCancel(e)) {
          console.log('Request canceled:', e.message);
          return; // Do not update UI if aborted
      }
      const errorMsg = e.response?.data ? new TextDecoder().decode(e.response.data) : (e.message || 'Unknown Rendering Error');
      currentPanel.webview.html = getWebviewContent(currentPanel.webview, '', errorMsg);
    }
  }, 800);
}

function isRelevant(doc: vscode.TextDocument) { return doc.languageId === 'xsl' || doc.fileName.endsWith('.xsl') || doc.fileName.endsWith('.xslt'); }

function startBackendServer(context: vscode.ExtensionContext) {
  const serverPath = path.join(context.extensionPath, '..', 'server', 'dist', 'index.js');
  serverProcess = child_process.spawn('node', [serverPath], { env: { ...process.env, PORT: PORT.toString() } });
}

function getWebviewContent(webview: vscode.Webview, pdfUri: string, error?: string) {
  const xmlName = currentXmlUri ? path.basename(currentXmlUri.fsPath) : 'SAMPLE_DATA';
  const displayError = error ? `
    <div id="error-overlay" style="position: absolute; top: 64px; left: 16px; right: 16px; background: rgba(200, 0, 0, 0.9); color: white; padding: 12px; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 1000; font-family: monospace; white-space: pre-wrap;">
        <div style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 4px;">⚠️ RENDERING ERROR</div>
        ${error}
    </div>` : '';

  return `<!DOCTYPE html><html lang="en"><head>
  <style>
    :root { --bg: #1e1e1e; --side: #252526; --accent: #007acc; --border: #444; --text: #cccccc; }
    body { margin: 0; padding: 0; width: 100vw; height: 100vh; background: var(--bg); color: var(--text); font-family: sans-serif; display: flex; flex-direction: column; overflow: hidden; position: relative; }
    .status { height: 24px; background: var(--accent); color: white; display: flex; align-items: center; padding: 0 12px; font-size: 11px; gap: 12px; }
    .toolbar { height: 40px; background: var(--side); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 16px; gap: 8px; }
    .spacer { flex: 1; }
    .btn { background: #3c3c3c; border: 1px solid var(--border); color: white; padding: 4px 12px; border-radius: 2px; font-size: 11px; cursor: pointer; border: none; }
    .btn:hover { background: #505050; }
    .btn.primary { background: var(--accent); color: white; }
    .preview { flex: 1; background: #525659; }
    iframe { width: 100%; height: 100%; border: none; }
  </style></head><body>
  ${displayError}
  <div class="toolbar">
    <div style="font-weight: bold; font-size: 12px; color: var(--accent);">ARIBA WORKBENCH v6.0</div>
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

class AribaSampleProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;
  constructor(private path: string) {}
  refresh(): void { this._onDidChangeTreeData.fire(); }
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem { return element; }
  async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (!element) {
        try {
            const result = await vscode.workspace.fs.readDirectory(vscode.Uri.file(this.path));
            return result.filter(([name]) => name.endsWith('.xml')).map(([name]) => {
                const item = new vscode.TreeItem(name, vscode.TreeItemCollapsibleState.None);
                item.iconPath = new vscode.ThemeIcon('database');
                item.command = { command: 'ariba-pdf-preview.openSample', title: 'Open', arguments: [vscode.Uri.file(path.join(this.path, name))] };
                return item;
            });
        } catch (e) { return []; }
    }
    return [];
  }
}

export function deactivate() { if (serverProcess) serverProcess.kill(); }
