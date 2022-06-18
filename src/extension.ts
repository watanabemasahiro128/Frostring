// Copyright (c) 2022 Masahiro

import * as vscode from 'vscode';
import { subscribeToDocumentChanges, FROZEN_STRING_LITERAL } from './diagnostics';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      'ruby',
      new Frostring(),
      { providedCodeActionKinds: Frostring.providedCodeActionKinds }
    )
  );

  const frostringDiagnostics = vscode.languages.createDiagnosticCollection('frostring');
  context.subscriptions.push(frostringDiagnostics);
  subscribeToDocumentChanges(context, frostringDiagnostics);
}

export class Frostring implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  public provideCodeActions(document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] | undefined {
    const currentLine = range.start.line;
    if (currentLine !== 0 || this.hasFrozenStringLiteralCommnet(document, currentLine)) return;

    const frozenStringLiteralTrue = this.createFix(document, `${FROZEN_STRING_LITERAL} true`);
    frozenStringLiteralTrue.isPreferred = true;
    const frozenStringLiteralFalse = this.createFix(document, `${FROZEN_STRING_LITERAL} false`);
    return [frozenStringLiteralTrue, frozenStringLiteralFalse];
  }

  private hasFrozenStringLiteralCommnet(document: vscode.TextDocument, currentLine: number) {
    return document.lineAt(currentLine).text.includes(FROZEN_STRING_LITERAL);
  }

  private createFix(document: vscode.TextDocument, frozenStringLiteralCommnet: string): vscode.CodeAction {
    const fix = new vscode.CodeAction(`Add ${frozenStringLiteralCommnet}`, vscode.CodeActionKind.QuickFix);
    fix.edit = new vscode.WorkspaceEdit();
    let insertText = frozenStringLiteralCommnet + '\n';
    if (document.lineAt(0).text !== '') insertText += '\n';
    fix.edit.insert(document.uri, new vscode.Position(0, 0), insertText);
    return fix;
  }
}
