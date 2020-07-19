import { RColor } from './rpg.internal';

/** Interface for Sphere binary raw bitmap images */
export interface RBitmap {
	/** Bitmap width in pixels */
	width: number;
	/** Bitmap height in pixels */
	height: number;
	/** Raw bitmap pixel data */
	data: Uint8Array;
	/** Reserved bytes */
	reserved: Uint8Array;
	/** Optional file-specific metadata */
	metadata?: any | undefined;
}

/** Interface for parsed Sphere bitmap images */
export interface RImage {
	/** Image metadata */
	metadata: RBitmap;
	/** Bitmap pixel data as RGBA */
	data: RColor[];
}

/** Utility function to convert raw bytes to 32-bit RGBA colors array */
export function parseBitmap(d: Uint8Array): RColor[] {
	let ret: RColor[] = [];
	let i = -1; while (i < d.length) {
		let color: RColor = {
			'red': d[++i],
			'green': d[++i],
			'blue': d[++i],
			'alpha': d[++i],
		};
		ret.push(color);
	}
	return ret;
}
