// Copyright (c) 2021 Masahiro

import * as vscode from 'vscode';

export const FROZEN_STRING_LITERAL = '# frozen_string_literal:';

export function refreshDiagnostics(document: vscode.TextDocument, frostringDiagnostics: vscode.DiagnosticCollection): void {
  if (
    (document.languageId !== 'ruby' && document.languageId !== 'gemfile') ||
    document.isUntitled ||
    document.uri.scheme !== 'file'
  ) {
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
  const lineOfText = document.lineAt(0);
  if (!lineOfText.text.includes(FROZEN_STRING_LITERAL)) {
    diagnostics.push(createDiagnostic(document, lineOfText));
  }
  frostringDiagnostics.set(document.uri, diagnostics);
}

function createDiagnostic(document: vscode.TextDocument, lineOfText: vscode.TextLine): vscode.Diagnostic {
  const diagnostic = new vscode.Diagnostic(
    new vscode.Range(0, 0, 0, lineOfText.text.length),
    'Do you want to add frozen string literal comment?',
    vscode.DiagnosticSeverity.Information
  );
  return diagnostic;
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, frostringDiagnostics: vscode.DiagnosticCollection): void {
  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(vscode.window.activeTextEditor.document, frostringDiagnostics);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(
      editor => {
        if (editor) {
          refreshDiagnostics(editor.document, frostringDiagnostics);
        }
      }
    )
  );
  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => refreshDiagnostics(e.document, frostringDiagnostics)));
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => frostringDiagnostics.delete(doc.uri)));
}
