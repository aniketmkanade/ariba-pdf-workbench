import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Ariba PDF WEB Extension Active (Running in Web Worker)!');

  // Note: Local server and child_process are NOT available in browser context.
  // This entry point would communicate with a remote Ariba Transformation Service.

  let openPreviewCmd = vscode.commands.registerCommand('ariba-pdf-preview.openPreview', () => {
    vscode.window.showInformationMessage('Ariba Web Preview: Please connect to a remote transformation engine in settings.');
  });

  context.subscriptions.push(openPreviewCmd);
}

export function deactivate() {}
