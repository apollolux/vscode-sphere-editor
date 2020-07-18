import * as vscode from 'vscode';
import { LXprovider } from './extension.provider';
import * as SphereEditor from "./editor.provider";

let LX: LXprovider;
let SphereContext: vscode.Disposable;

export function activate(context: vscode.ExtensionContext): void {
	console.log('LX::Sphere', 'Hello from Sphere!');
	LX = new LXprovider(context);
	SphereContext = SphereEditor.default.register(context);
	const cmdHello = vscode.commands.registerCommand(
		'sphereEdit.message', () => {
			vscode.window.showInformationMessage('Hello Sphere!');
		}
	);
	const cmdOpenFont = vscode.commands.registerTextEditorCommand(
		"sphereEdit.openFont",
		(textEditor: vscode.TextEditor) => {
			vscode.commands.executeCommand("vscode.openWith", textEditor.document.uri, "sphereEdit.font");
		}
	);
	LX.add(cmdHello);
	LX.add(cmdOpenFont);
	LX.add(SphereContext);
	// context.subscriptions.push(cmd);
	context.subscriptions.push(...LX.commands);
}
export function deactivate(): void {
	// TODO: dispose disposables
}


// [![marketplace](https://badgen.net/vs-marketplace/v/henoc.svgeditor)](https://marketplace.visualstudio.com/items?itemName=henoc.svgeditor)
