import * as vscode from 'vscode';

export class LXprovider {
	private _commands: vscode.Disposable[] = [];
	constructor(
		private readonly _context: vscode.ExtensionContext
	) {
		this._commands = [];
	}
	public add(cmd: vscode.Disposable): void {
		this._commands.push(cmd);
	}
	public get commands(): vscode.Disposable[] { return this._commands; }
}
