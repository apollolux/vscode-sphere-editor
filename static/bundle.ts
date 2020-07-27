/**
 * bundle.ts
 */

import { VirtualViewport } from "./viewport";
import { ChunkHandler } from "./buffer";
import { MessageHandler } from "./messenger";

import { RFont } from "./formats/rpg.font";
// import { blitTo } from "./formats/rpg.bitmap";

// import { Grid } from "./lx/grid";
// import { Palette } from "./lx/palette";
import { NCanvas } from "./lx/canvas";

declare const acquireVsCodeApi: any;
export const vscode = acquireVsCodeApi();

export let sphereDocument: VirtualViewport; 
export const Messenger = new MessageHandler(10);
export const chunker: ChunkHandler = new ChunkHandler(Messenger);

/** Main entry */
((W, D): void => {
	const I = D.getElementById.bind(D);
	// const E = D.createElement.bind(D);
	let rfn: RFont;
	function _set_preview_text(txt: string): void {
		const state = vscode.getState();
		let rfn_preview = state?.rfn?.preview || txt;
		if (txt && rfn_preview !== txt) {
			let rfn_state = Object.assign({}, state, { "rfn": {
				"preview": txt
			} });
			vscode.setState(rfn_state);
			// TODO: update preview render
		}
	}
	function _upd_preview(e: Event): void {
		let el = e.target;
		let txt = el ? (el as HTMLInputElement).value : '';
		_set_preview_text(txt);
	}
	// TODO: put message handler into front-end messenger like back-end
	W.addEventListener('message', async e => {
		// TODO
		const { type, body, requestId } = e.data;
		const state = vscode.getState();
		// const config = vscode.workspace.getConfiguration("sphereEdit");
		console.log("LX::SPH", "W>MSG", e.source, requestId, type, body);
		switch (type) {
			case "init": {
				// TODO: load the html body that was sent over
				if (body.html) {
					// TODO
					const doc = I('sph');
					if (doc) doc.innerHTML = body.html;
					else D.body.innerHTML = body.html, D.body.id = 'sph';
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
					// cons.innerHTML += `<p>list zoom: ${config.list.zoom}</p>`;
					// cons.innerHTML += `<p>glyph zoom: ${config.glyph.zoom}</p>`;
					// cons.innerHTML += `<p>glyph scale: ${config.glyph.zoomScale}</p>`;
				}
				let rfn_preview = state?.rfn?.preview || 'What a beautiful day for laundry!';
				let rfn_glyph = state?.rfn?.glyph || 65;
				// get header
				let hdr_rfn = await chunker.requestRawData(0, 256);
				if (hdr_rfn) {
					let view_rfn = new DataView(hdr_rfn.data.buffer);
					rfn = new RFont(hdr_rfn.data);
					let rfn_ver = rfn.version;	// view_rfn.getUint16(4, true);
					let rfn_ch = view_rfn.getUint16(6, true);
					let rfn_data = await chunker.requestRawData(256, body.fileSize);
					let n = rfn.init(rfn_data.data);
					const inp_preview = I('rfn-preview-text');
					if (inp_preview) {
						(inp_preview as HTMLInputElement).value = rfn_preview;
						inp_preview.addEventListener("input", _upd_preview);
					}
					const rfn_meta = I('ftr-rfn-meta-global');
					if (rfn_meta) {
						rfn_meta.textContent = `RFNv${rfn_ver}, # glyphs: ${n} (expected ${rfn_ch})`;
					}
					const rfn_can = I('rfn-canvas-wr');
					if (rfn_can) {
						let bmp = rfn.getCharacterImage(rfn_glyph);
						let ncanvas = new NCanvas(bmp.width, bmp.height);
						ncanvas.id = 'rfn-canvas';
						ncanvas.zoom = 16;
						// let gr = Grid.create(bmp.width, bmp.height);
						// gr.id = 'rfn-canvas';
						// let can = E('canvas');
						// can.id = 'rfn-canvas';
						// can.width = 32; can.height = 32;
						// can.classList.add('lx-canvas');
						// can.style.setProperty("--mouse-x", `12`);
						// can.style.setProperty("--mouse-y", `20`);
						// let gr = new Grid(can);
						// gr.zoom = 16;
						// gr.appendTo(rfn_can);
						rfn_can.append(ncanvas.container);
						// rfn_can.appendChild(gr.element);
						let ctx = ncanvas.element.getContext('2d');
						// if (ctx) blitTo(ctx, bmp, 0, 0, gr.scaleX, gr.scaleY);
						// if (bmp && ctx) bmp.blitTo(ctx, 0, 0);
						ncanvas.canvas.blitImage(bmp, 0, 0);
						// let pal = new Palette(4, 2, 32);
						// pal.id = 'rfn-palette';
						// pal.add(
						// 	{ red: 255, green: 255, blue: 128, alpha: 255 },
						// 	{ red: 128, green: 224, blue: 255, alpha: 192 }
						// );
						// rfn_can.append(pal.container);
					}
					let rfn_state = Object.assign({}, state, { "rfn": {
						"preview": rfn_preview,
						"glyph": rfn_glyph
					} });
					vscode.setState(rfn_state);
					Messenger.alert(`RFNv${rfn_ver}, # glyphs: ${n} (expected ${rfn_ch})`);
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