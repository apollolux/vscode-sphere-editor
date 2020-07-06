/**
 * rpg.font.ts
 * TS reimplementation of Sphere RFN for VSCode extension usage
 * @author Alex Rosario
 */

import { RBitmap, RImage, parseBitmap } from './rpg.bitmap';

/****
RPG Font Format
Chad Austin
2000.06.23
****/

/**
 * RFN file header, 256 bytes total
 * byte signature[4];   // Must be ".rfn"
 * word version;        // Must be 1 or 2
 * word num_chars;
 * byte reserved[248];
 **/
interface RFontHeader {
	/** File signature '.rfn' */
	readonly signature: string;
	/** File version, ideally 2 or higher */
	readonly version: number;
	/** Number of bitmap characters saved */
	readonly characters: number;
	/** Reserved bytes, 248 */
	readonly reserved: Uint8Array;
};

class RFont {
	private _data: Uint8Array = new Uint8Array;
	private _header: RFontHeader | null = null;
	images: RImage[] = [];

	__construct(d: Uint8Array) {
		let view = new DataView(d);
		this._data = d;
		this._header = {
			'signature': d.slice(0, 4).toString(),
			'version': view.getUint16(4, true),
			'characters': view.getUint16(6, true),
			'reserved': d.slice(8, 256)
		};
		if (this._header?.signature === '.rfn') {
			// process
			let n = this.init(d.slice(256));
			// TODO: check n != characters ?
		}
	}
	public get data(): Uint8Array { return this._data; }

	/** Process raw bytes into Sphere font */
	init(d: Uint8Array): number {
		if (!d || !this._header) return -1;
		let ret = 0;
		let chars: RImage[] = [];
		let view = new DataView(d);
		let p = 0;
		if (this._header?.version > 1) {
			let i = this._header.characters;
			let q = -1;
			let _h = 0;	// font max height for Font.getHeight()
			while (--i > -1) {
				let w = view.getUint16(p, true);
				let h = view.getUint16(p+2, true);
				let r = d.slice(p+4, p+32);
				p += 32;
				let bmp: RBitmap = {
					'width': w,
					'height': h,
					'data': new Uint8Array,
					'reserved': r
				};
				let z = (w*h)<<2;
				bmp.data = d.slice(p, p+z);
				let img: RImage = {
					'metadata': bmp,
					'data': parseBitmap(bmp.data)
				};
				chars[++q] = img;
				p += z;
			}
			ret = chars.length;
			this.images = chars;
		}
		return ret;
	}
};

/****
 * RFN character data
 **/
/*
Each character has its own 32-byte header that goes like this:
word width;
word height;
byte reserved[28];

If version is 1, character data is a series (width * height) of bytes representing an
8-bit greyscale image.  Color 255 is opaque, color 0 is transparent.  Version 1 doesn't
inherently have a color associated with it, but it should default to white.  If version
is 2, character data is a series of RGBA pixels.
*/
