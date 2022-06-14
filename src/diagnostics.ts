// Copyright (c) 2022 Masahiro

import * as vscode from 'vscode';

const decorationType = vscode.window.createTextEditorDecorationType({
  after: {
    color: '#808080',
    backgroundColor: '#2F2F2F',
    textDecoration: `;
      margin: 0.1em 0.25em 0.1em 0.1em;
      border: thin solid #606060;
      border-radius: 0.2em;
    `,
  },
});
export const FROZEN_STRING_LITERAL = '# frozen_string_literal:';

function refreshDiagnostics(document: vscode.TextDocument, frostringDiagnostics: vscode.DiagnosticCollection): void {
  if ((document.languageId !== 'ruby' && document.languageId !== 'gemfile') || document.uri.scheme !== 'file') return;

  const diagnostics: vscode.Diagnostic[] = [];
  const lineOfText = document.lineAt(0);
  if (!lineOfText.text.includes(FROZEN_STRING_LITERAL)) diagnostics.push(createDiagnostic(document, lineOfText));
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

function refreshDecorations(editor: vscode.TextEditor): void {
  if ((editor.document.languageId !== 'ruby' && editor.document.languageId !== 'gemfile') || editor.document.uri.scheme !== 'file') return;

  const options: vscode.DecorationOptions[] = [];
  if (!editor.document.lineAt(0).text.includes(FROZEN_STRING_LITERAL)) options.push(createDecorationOptions());
  editor.setDecorations(decorationType, options);
}

function createDecorationOptions(): vscode.DecorationOptions {
  return {
    range: new vscode.Range(0, 0, 0, 0),
    renderOptions: {
      after: {
        contentText: 'Missing frozen string literal',
      },
    },
  };
}

export function subscribeToDocumentChanges(context: vscode.ExtensionContext, frostringDiagnostics: vscode.DiagnosticCollection): void {
  if (vscode.window.activeTextEditor) {
    refreshDecorations(vscode.window.activeTextEditor);
    refreshDiagnostics(vscode.window.activeTextEditor.document, frostringDiagnostics);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(
      editor => {
        if (!editor) return;

        refreshDecorations(editor);
        refreshDiagnostics(editor.document, frostringDiagnostics);
      }
    )
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(
      event => {
        const editor = vscode.window.visibleTextEditors.find(
          (e) => e.document === event.document
        );
        if (editor) refreshDecorations(editor);
        refreshDiagnostics(event.document, frostringDiagnostics);
      }
    )
  );
  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => frostringDiagnostics.delete(doc.uri)));
}
