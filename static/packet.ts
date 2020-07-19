import { RBitmap } from "./formats/rpg.bitmap";

export interface VirtualizedPacket {
	offset: number;
	data: Uint8Array;
}
export interface VirtualizedBitmapPacket extends VirtualizedPacket {
	bitmap: RBitmap;
}
