import * as vscode from 'vscode';
import { LXprovider } from './extension.provider';

export function activate(context: vscode.ExtensionContext): void {
	console.log('LX::VSC', 'hello!');
	context.subscriptions.push(...LXprovider.commands);
}
export function deactivate(): void {}
