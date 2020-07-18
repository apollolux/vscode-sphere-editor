/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/**
 * buffer.ts
 */

import { VirtualViewport } from "./viewport";
import { MessageHandler } from "./messenger";
import { VirtualizedPacket } from "./packet";

 /**
 * buffer.ts : ChunkHandler
 * Copyright (c) mostly Microsoft Corporation.
 * Licensed under the MIT license.
 */

export class ChunkHandler {
	private _view: VirtualViewport | null;
	constructor(
		private readonly _msgr: MessageHandler
	) {
		// TODO
		this._view = null;
	}
	public attachViewport(doc: VirtualViewport): void {
		// TODO
		this._view = doc;
	}
	// public attachMessenger(msgr: MessageHandler): void {
	// 	this._msgr = msgr;
	// }
	public fillBuffer(offset: number): void {
		// TODO: request chunks
		for (let i = 0, maxChunks = 3; i < maxChunks; ++i) {
			this.requestChunk(offset + i);
		}
	}
	private async requestChunk(offset: number): Promise<void> {
		console.log("LX::SPH", "BUF::REQ>", offset);
		// TODO
		try {
			const req = await this._msgr?.postMessageWithResponse("packet", {
				"initialOffset": offset,
				"count": 1
			});
			console.log(
				"LX::SPH", "BUF::>REQ",
				offset,
				Object.keys(req),
				(req.data instanceof Uint8Array && 'Uint8Array') || (req.data instanceof Buffer && 'Buffer')
			);
			console.log("::", Object.entries(req));
			this.processChunk(req);
		} catch (e) {
			return;
		}
	}
	public processChunk(req: any): void {
		// TODO
		const { offset, data } = req;
		console.log("LX::SPH", "BUF::PROC", offset, data?.byteLength || data?.length || -1, data.toString());
		const packets: VirtualizedPacket[] = [];
		// TODO
		for (let i = 0, l = data.length; i < l; ++i) {
			packets.push({ "offset": (offset + i) });
		}
		this._view?.render(packets);
		// TODO: redo edits
	}
}