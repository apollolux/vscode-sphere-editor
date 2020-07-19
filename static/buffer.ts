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
	public fillBuffer(offset: number, count: number): void {
		// TODO: request chunks
		let num = 0;
		count = Math.abs(count);
		for (let i = 0, maxChunks = 3; i < maxChunks; ++i) {
			this.requestChunk(offset + num, count);
			num += count;
		}
	}
	public async requestRawData(offset: number, count: number): Promise<VirtualizedPacket> {
		console.log("LX::SPH", "BUF::RAW>", offset, count);
		const req = await this._msgr?.postMessageWithResponse("packet", {
			"initialOffset": offset,
			"count": count
		});
		return {
			"offset": offset,
			"data": new Uint8Array(req.data)
		};
	}
	public async requestChunk(offset: number, count: number): Promise<void> {
		console.log("LX::SPH", "BUF::REQ>", offset, count);
		// TODO
		try {
			const req = await this._msgr?.postMessageWithResponse("packet", {
				"initialOffset": offset,
				"count": count
			});
			console.log(
				"LX::SPH", "BUF::>REQ",
				offset,
				count,
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
			packets.push({ "offset": (offset + i), "data": new Uint8Array(data) });
		}
		this._view?.render(packets);
		// TODO: redo edits
	}
}