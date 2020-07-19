/**
 * bundle.ts
 */

import { VirtualViewport } from "./viewport";
import { ChunkHandler } from "./buffer";
import { MessageHandler } from "./messenger";

declare const acquireVsCodeApi: any;
export const vscode = acquireVsCodeApi();

export let sphereDocument: VirtualViewport; 
export const Messenger = new MessageHandler(10);
export const chunker: ChunkHandler = new ChunkHandler(Messenger);

/** Main entry */
((W, D): void => {
	const I = D.getElementById.bind(D);
	// TODO: put message handler into front-end messenger like back-end
	W.addEventListener('message', async e => {
		// TODO
		const { type, body, requestId } = e.data;
		console.log("LX::SPH", "W>MSG", e.source, requestId, type, body);
		switch (type) {
			case "init": {
				// TODO: load the html body that was sent over
				if (body.html) {
					// TODO
					const doc = D.body;
					doc.innerHTML = body.html;
					sphereDocument = new VirtualViewport(body.fileSize);
					(W as any).sphereDocument = sphereDocument;	// add sphDoc to global
					// TODO: ensure buffer
					chunker.attachViewport(sphereDocument);
					chunker.fillBuffer(sphereDocument.offsetTop(), 4);
					// TODO: load font bitmaps onto canvasses
					// TODO: debounce the scroll so it isn't called excessively
				}
				console.log("LX::Sphere", "init", body.signature, body);
				const cons = I("rfn-console");
				if (cons) {
					cons.innerHTML += `<p>init (${body.signature})</p>`;
				}
				// get header
				let hdr_rfn = await chunker.requestRawData(0, 8);
				if (hdr_rfn) {
					let view_rfn = new DataView(hdr_rfn.data.buffer);
					let rfn_ver = view_rfn.getUint16(4, true);
					let rfn_ch = view_rfn.getUint16(6, true);
					const rfn_meta = I('ftr-rfn-meta-global');
					if (rfn_meta) {
						rfn_meta.textContent = `Version: ${rfn_ver}, # glyphs: ${rfn_ch}`;
					}
				}
				// TODO: nag if "large file size warning" exists
				break;
			}
			case "update": {
				// handle undo/redo
				if (body.type === "undo") {
					// TODO
					console.log("LX::Sphere", "unimplemented update 'undo'", body.type);
				}
				else if (body.type === "redo") {
					// TODO
					console.log("LX::Sphere", "unimplemented update 'redo'", body.type);
				}
				else {
					console.log("LX::Sphere", "unimplemented update type", body.type);
				}
				break;
			}
			case "save": {
				// TODO: remove "edited" class from dirty items
				break;
			}
			default: {
				// forward not-yet-accounted-for type to message handler
				Messenger.incomingMessageHandler(e.data);
				break;
			}
		}
	});
	// TODO: signal to VS Code that the webview is initialized
	Messenger.postMessage("ready");
})(window, document);