import * as vscode from 'vscode';
import * as SphereEditor from "./editor.provider";

export class LXprovider {
	private static _commands: vscode.Disposable[] = [];
	constructor(
		private readonly _context: vscode.ExtensionContext
	) {
		LXprovider._commands = [];
		LXprovider._commands.push(vscode.commands.registerCommand(
			'sphereEdit.message', () => {
				vscode.window.showInformationMessage('Hello Sphere!');
			}
		));
		LXprovider._commands.push(SphereEditor.default.register(_context));
	}
	public static get commands(): vscode.Disposable[] { return LXprovider._commands; }
};
