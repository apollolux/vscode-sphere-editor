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
	// TODO: put message handler into front-end messenger like back-end
	W.addEventListener('message', async e => {
		// TODO
		console.log("LX::SPH", "W>MSG", e.source, e.data.requestId, e.data.type, e.data.body);
		const { type, body } = e.data;
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
					chunker.fillBuffer(sphereDocument.offsetTop());
					// TODO: load font bitmaps onto canvasses
					// TODO: debounce the scroll so it isn't called excessively
				}
				console.log("LX::Sphere", "init", body);
				const cons = document.getElementById("rfn-console");
				if (cons) {
					cons.innerHTML += '<p>init</p>';
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