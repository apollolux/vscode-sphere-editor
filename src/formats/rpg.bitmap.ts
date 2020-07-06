import { RColor } from '../common/rpg.internal';

/** Interface for Sphere binary raw bitmap images */
export interface RBitmap {
	width: number;
	height: number;
	data: Uint8Array;
	reserved: Uint8Array;
};

/** Interface for parsed Sphere bitmap images */
export interface RImage {
	metadata: RBitmap;
	data: RColor[];
}

/** Utility function to convert bytes to raw RGBA colors array */
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
