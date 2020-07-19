/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as vscode from "vscode";

import { SphereDocument } from "./common/editor.document";

const LX_STRICT_DUP = 0;

/** Message packet interface for webview passing */
// interface PacketRequest {
// 	initialOffset: number;
// 	numElements: number;
// }


// MESSAGE PASSING STUFF

export class LXMessenger {
	private _reqId: number;
	private readonly _callbacks = new Map<number, (response: any) => void>();
	private readonly handlers = new Map<string, (panel: vscode.WebviewPanel, document: SphereDocument, msg: any) => void>();

	constructor() {
		this._reqId = 0;
	}

	public setHandler(
		type: string,
		fn: (panel: vscode.WebviewPanel, document: SphereDocument, msg: any) => void
	): void {
		if (LX_STRICT_DUP && this.handlers.get(type)) {
			if (LX_STRICT_DUP > 1)
				throw new Error(`Cannot overwrite handler for type '${type}' in strict mode`);
			else
				console.log("LX::SPH", "MSG", `Warning: overwriting handler for type '${type}'`);
		}
		this.handlers.set(type, fn);
	}

	/** Post message to webview panel and cache the callback */
	public postMessageWithResponse<R = unknown>(panel: vscode.WebviewPanel, type: string, body: any): Promise<R> {
		// NOTE: keep the name `requestId` for prob ES obj prop spread reasons +asr 20200704
		const requestId = ++this._reqId;
		console.log("LX::SPH", "MSG>R", requestId, panel.title, type, body);
		const p = new Promise<R>((res) => (this._callbacks.set(requestId, res)));
		panel.webview.postMessage({ type, reqId: requestId, body });
		return p;
	}
	/** Post message to webview panel */
	public postMessage(panel: vscode.WebviewPanel, type: string, body: any): void {
		console.log("LX::SPH", "MSG>", panel.title, type, body);
		panel.webview.postMessage({ type, body });
	}
	/** Handle message */
	public onMessage(panel: vscode.WebviewPanel, document: SphereDocument, msg: any): void {
		console.log("LX::SPH", ">MSG", panel.title, document.uri, msg);
		let fn = this.handlers.get(msg.type);
		if (fn) fn(panel, document, msg);
		else console.log("LX::SPH", ">MSG", "unsupported type", msg.type);
	}
}