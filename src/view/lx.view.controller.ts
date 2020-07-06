import * as vscode from "vscode";
import { getNonce, readTextFile } from "../common/util";
import path = require("path");

/** View controller */
export default class LXViewController {
	constructor(private readonly _context: vscode.ExtensionContext) {}
	public async readFromFile(uri: vscode.Uri, webview: vscode.Webview, css: string[] = [], js: string[] = []): Promise<string> {
		let ret = await readTextFile(uri);
		return this.readFromString(ret, webview, css, js);
	}
	public readFromString(inp: string, webview: vscode.Webview, css: string[] = [], js: string[] = []): string {
		let ret = inp;
		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();
		// replace replaceables
		ret = ret.replace(/\$\{NONCE\}/gi, nonce);
		ret = ret.replace(/\$\{WV_SRC\}/gi, webview.cspSource);
		const _css = css.map((it) => {
			let u = this.toLocalResource(it, webview);
			return `<link href="${u}" rel="stylesheet" />`;
		});
		const _js = js.map((it) => {
			let u = this.toLocalResource(it, webview);
			return `<script nonce="${nonce}" src="${u}" defer></script>`;
		});
		ret = ret.replace('<!-- ${LX::HEAD} -->', _css.join('\n'));
		ret = ret.replace('<!-- ${LX::FOOT} -->', _js.join('\n'));
		return ret;
	}
	private toLocalResource(fn: string, webview: vscode.Webview): vscode.Uri {
		return webview.asWebviewUri(vscode.Uri.file(
			path.join(this._context.extensionPath, "dist", fn)
		));
	}
}