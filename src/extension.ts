import * as vscode from 'vscode';
import { LXprovider } from './extension.provider';
import * as SphereEditor from "./editor.provider";

let LX: LXprovider;
let SphereContext: vscode.Disposable;

export function activate(context: vscode.ExtensionContext): void {
	console.log('LX::Sphere', 'Hello from Sphere!');
	LX = new LXprovider(context);
	SphereContext = SphereEditor.default.register(context);
	let cmd = vscode.commands.registerCommand(
		'sphereEdit.message', () => {
			vscode.window.showInformationMessage('Hello Sphere!');
		}
	);
	LX.add(cmd);
	LX.add(SphereContext);
	// context.subscriptions.push(cmd);
	context.subscriptions.push(...LX.commands);
}
export function deactivate(): void {
	// TODO: dispose disposables
}
