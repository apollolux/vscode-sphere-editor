/**
 * bundle.ts
 */

import { VirtualDocument } from "./document";
import { MessageHandler } from "./messenger";

declare const acquireVsCodeApi: any;
export const vscode = acquireVsCodeApi();

export let sphereDocument: VirtualDocument; 
export const Messenger = new MessageHandler(10);

/** Main entry */
((W, D): void => {
	W.addEventListener('message', async e => {
		// TODO
		const { type, body } = e.data;
		switch (type) {
			case "init": {
				// TODO: load the html body that was sent over
				if (body.html) {
					// TODO
					const doc = D.body;
					doc.innerHTML = body.html;
					sphereDocument = new VirtualDocument(body.fileSize);
					(W as any).sphereDocument = sphereDocument;
					// TODO: load buffer chunks
					// TODO: load font bitmaps onto canvasses
					// TODO: debounce the scroll so it isn't called excessively
				}
				console.log("LX::Sphere", "init", body);
				// TODO: nag if "large file size warning" exists
				break;
			}
			case "update": {
				// handle undo/redo
				if (body.type === "undo") {
					// TODO
				}
				else if (body.type === "redo") {
					// TODO
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