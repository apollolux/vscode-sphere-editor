import * as vscode from "vscode";
import path = require("path");

import { LXMessenger } from "./editor.messenger";
import { LXViewController } from "./view/lx.view.controller";

import { disposeAll } from "./common/dispose";
import { readTextFile } from "./common/util";
import { WebviewCollection } from "./common/webviews";

import { SphereDocument, SphereDocumentState } from "./common/editor.document";

/** Message packet interface for webview passing */
interface PacketRequest {
	initialOffset: number;
	count: number;
}

const Dec = new TextDecoder('utf-8');

export default class SphereEditor implements vscode.CustomEditorProvider<SphereDocument> {
	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(
			SphereEditor.viewType,
			new SphereEditor(context),
			{
				supportsMultipleEditorsPerDocument: false,
				"webviewOptions": {
					"retainContextWhenHidden": true
				}
			}
		);
	}
	static checkSignature(fn: string, file: Uint8Array): string {
		const magic = file.slice(0, 4);
		const sig = Dec.decode(magic);
		const ext = fn.substring(fn.lastIndexOf('.'));
		if (ext === ('.rfn') && sig === '.rfn') return 'font';
		else if (ext === ('.rmp') && sig === '.rmp') return 'map';
		else if (ext === ('.rts') && sig === '.rts') return 'tileset';
		else if (ext === ('.rss') && sig === '.rss') return 'spriteset';
		else if (ext === ('.rws') && sig === '.rws') return 'windowstyle';
		return '?';
	}
	static createFontEditor(doc: SphereDocument): void {
		// TODO
		console.log("LX::SPH", "FONT", "TODO: create font editor here", doc.uri);
	}

	private static readonly viewType = 'sphereEdit.font';
	private readonly webviews = new WebviewCollection();
	private lxView: LXViewController;
	private lxMsgr: LXMessenger;
	private html?: string;
	private htmlFont?: string;

	constructor(
		private readonly _context: vscode.ExtensionContext
	) {
		this.lxView = new LXViewController(_context);
		this.lxMsgr = new LXMessenger();
		// this.html = '';
		// this.htmlFont = '';
		this.initMessenger();
		console.log("LX::Sphere", "Editor initialized");
	}

	async openCustomDocument(uri: vscode.Uri, openContext: vscode.CustomDocumentOpenContext, token: vscode.CancellationToken): Promise<SphereDocument> {
		console.log("LX::SPH", "OPEN", uri, openContext.backupId, token);
		// NOTE: the code doesn't like renaming `document` to anything else for the event obj prob for ES obj prop spread reasons +asr 20200704
		const document = await SphereDocument.create(uri, openContext.backupId);
		console.log("LX::SPH", "OPEN!", document.filesize, document.data.slice(0, 8));
		this.html = await readTextFile(vscode.Uri.file(
			this.toLocalPath("dist", "view", "editor.html")
		));
		this.htmlFont = await readTextFile(vscode.Uri.file(
			this.toLocalPath("dist", "view", "editor.font.html")
		));
		// We don't need any listeners right now because the document is readonly, but this will help to have when we enable edits
		const listeners: vscode.Disposable[] = [];
		// if (type === 'font') SphereEditor.createFontEditor(document);
		// listening to user edit
		listeners.push(document.onDidChange((e) => {
			this._onDidChangeCustomDocument.fire({
				document,
				...e
			});
		}));
		// update webviews when document changes
		listeners.push(document.onDidChangeContent((e) => {
			for (const panel of this.webviews.get(document.uri)) {
				this.lxMsgr.postMessage(panel, "update", {
					'fileSize': e.fileSize,
					'type': e.type,
					'edits': e.edits,
					'content': e.content,
				});
			}
		}));
		document.onDidDispose(() => disposeAll(listeners));
		return document;
		// throw new Error("Method not implemented.");
	}
	async resolveCustomEditor(document: SphereDocument, panel: vscode.WebviewPanel, token: vscode.CancellationToken): Promise<void> {
		console.log("LX::SPH", "RES", document.uri, panel.title, token);
		// Add the webview to our internal set of active webviews
		this.webviews.add(document.uri, panel);
		const type = SphereEditor.checkSignature(document.uri.path, document.data);
		console.log("::", type, document.uri.path);
		// Setup initial content for the webview
		panel.webview.options = {
			enableScripts: true,
		};
		if (!this.html) this.html = await readTextFile(vscode.Uri.file(
			this.toLocalPath("dist", "view", "editor.html")
		));
		if (!this.htmlFont) this.htmlFont = await readTextFile(vscode.Uri.file(
			this.toLocalPath("dist", "view", "editor.font.html")
		));
		// this.getHtmlForWebview offloaded to LXViewController or smth +asr 20200704
		panel.webview.html = this.lxView.readFromString(
			this.html,
			panel.webview,
			["sphereEdit.css"],
			["sphereEdit.js"]
		);
		panel.webview.onDidReceiveMessage((e) => {
			if (e.type !== "ready") {
				console.log("LX::SPH", "RES>MSG", e.type, e);
				this.lxMsgr.onMessage(panel, document, e);
			}
		});
		// Wait for the webview to be properly ready before we init
		panel.webview.onDidReceiveMessage((e) => {
			if (e.type === "ready") {
				this.lxMsgr.postMessage(panel, "init", {
					fileSize: document.filesize,
					signature: type,
					html: document.data.length === document.filesize ? this.htmlFont : undefined
				});
			}
		});
		panel.webview.onDidReceiveMessage(async (e) => {
			if (e.type == "open-anyways") {
				await document.openAnyways();
				this.lxMsgr.postMessage(panel, "init", {
					fileSize: document.filesize,
					html: this.htmlFont
				});
			}
		});
		// throw new Error("Method not implemented.");
	}

	// onDidChangeCustomDocument: vscode.Event<vscode.CustomDocumentEditEvent<SphereDocument>> | vscode.Event<vscode.CustomDocumentContentChangeEvent<SphereDocument> >;
	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter< vscode.CustomDocumentEditEvent<SphereDocument> >();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	saveCustomDocument(document: SphereDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		// Update all webviews that a save has just occured
		for (const panel of this.webviews.get(document.uri)) {
			this.lxMsgr.postMessage(panel, "save", {});
		}
		return document.save(cancellation);
		// throw new Error("Method not implemented.");
	}
	saveCustomDocumentAs(document: SphereDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.saveAs(destination, cancellation);
		// throw new Error("Method not implemented.");
	}
	revertCustomDocument(document: SphereDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.revert(cancellation);
		// throw new Error("Method not implemented.");
	}
	backupCustomDocument(document: SphereDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
		return document.backup(context.destination, cancellation);
		// throw new Error("Method not implemented.");
	}

	// LOCAL RESOURCES
	private toLocalPath(...fn: string[]) {
		return path.join(this._context.extensionPath, ...fn);
	}
	
	// MESSENGER
	private initMessenger(): void {
		// TODO
		this.lxMsgr.setHandler("packet", (panel: vscode.WebviewPanel, document: SphereDocument, msg: any) => {
			const request = msg.body as PacketRequest;
			// Return the data requested and the offset it was requested for
			const packet = /* Array.from */(document.data.slice(
				request.initialOffset,
				request.initialOffset + request.count
			));
			console.log(
				"LX::SPH", "PACKET",
				request,
				packet,
				packet.byteLength || packet.length || 0,
				(packet instanceof Uint8Array && 'Uint8Array') || (packet instanceof Buffer && 'Buffer')
			);
			const edits: SphereDocumentState[] = [];
			document.unsavedEdits.forEach((edit) => {
				if (edit.offset >= request.initialOffset && edit.offset < request.initialOffset + request.count) {
					edits.push(edit);
					// If it wasn't in the document before we will add it to the disk contents
					if (edit.oldValue === undefined && edit.newValue !== undefined) {
						// packet.push(edit.newValue);
					}
				}
			});
			panel.webview.postMessage({ type: "packet", requestId: msg.requestId, body: {
				fileSize: document.filesize,
				data: Array.from(packet),
				offset: request.initialOffset,
				edits: edits
			} });
		});
		this.lxMsgr.setHandler("edit", (panel: vscode.WebviewPanel, document: SphereDocument, msg: any) => {
			document.makeEdit(msg.body);
			// We respond with the size of the file so that the webview is always in sync with the ext host
			panel.webview.postMessage({
				type: "edit",
				requestId: msg.requestId,
				body: { fileSize: document.filesize }
			});
		});
	}
}
