/**
 * rpg.font.ts
 * TS reimplementation of Sphere RFN for VSCode extension usage
 * @author Alex Rosario
 */

import { RBitmap, RImage } from './rpg.bitmap';

const Dec = new TextDecoder('utf-8');

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
}

/** Sphere font class */
export class RFont {
	private _data: Uint8Array = new Uint8Array;
	private _header: RFontHeader | null = null;
	private _lineHeight: number = 0;
	/** Parsed font glyphs */
	glyphs: RImage[] = [];

	constructor(d: Uint8Array) {
		let view = new DataView(d.buffer);
		this._data = d;
		this._header = {
			'signature': Dec.decode(d.slice(0, 4)),
			'version': view.getUint16(4, true),
			'characters': view.getUint16(6, true),
			'reserved': d.slice(8, 256)
		};
		if (this._header?.signature === '.rfn') {
			// process
			if (d.byteLength > 256) {
				let n = this.init(d.slice(256));
				// TODO: check n != characters ?
				if (n !== this._header.characters) {
					// TODO: error check?
				}
			}
			else if (this._header.characters > 0) {
				console.log("LX::SPH", "FONT", "need the rest of the file to continue");
			}
		}
		else console.log("LX::SPH", "FONT", "not an RFN font");
	}
	/** Format version */
	public get version(): number { return this._header?.version || 0; }
	/** Raw file data */
	public get data(): Uint8Array { return this._data; }

	/** @API Global font height in pixels */
	public getHeight(): number { return this._lineHeight; }
	/** @API Get glyph of given code */
	public getCharacterImage(code: number): RImage {
		if (!this.glyphs.length) throw new Error("Font - no glyphs loaded");
		else if (code < 0 || code >= this.glyphs.length) throw new Error("Font - invalid glyph index");
		else return this.glyphs[code];
	}

	public charAt(d: Uint8Array, offset: number): RImage {
		let ret: RImage;
		let view = new DataView(d.buffer);
		let p = offset | 0;
		let w = view.getUint16(p, true);
		let h = view.getUint16(p+2, true);
		let r = d.slice(p+4, p+32);
		p += 32;
		// if (h > _h) _h = h;
		let z = (w*h) << 2;
		let bmp: RBitmap = {
			'width': w,
			'height': h,
			'data': d.slice(p, p+z),
			'reserved': r
		};
		bmp.metadata = {
			"offset": offset,
			"fileOffset": (offset + 256),
			"length": z
		};
		// bmp.data = d.slice(p, p+z);
		// ret = {
		// 	'metadata': bmp,
		// 	'data': parseBitmap(bmp.data)
		// };
		ret = new RImage(bmp);
		return ret;
	}

	/** Process raw bytes into Sphere font */
	init(d: Uint8Array): number {
		if (!d || !this._header) return -1;
		let ret = 0;
		let chars: RImage[] = [];
		// let view = new DataView(d);
		let p = 0;
		if (this._header?.version > 1) {
			let i = this._header.characters;
			let q = -1;
			let _h = 0;	// font max height for Font.getHeight()
			while (--i > -1) {
				let img = this.charAt(d, p);
				// let curOffset = p | 0;
				// let w = view.getUint16(p, true);
				// let h = view.getUint16(p+2, true);
				// let r = d.slice(p+4, p+32);
				// p += 32;
				// if (h > _h) _h = h;
				// let z = (w*h)<<2;
				// let bmp: RBitmap = {
				// 	'width': w,
				// 	'height': h,
				// 	'data': d.slice(p, p+z),
				// 	'reserved': r
				// };
				// bmp.metadata = { "offset": curOffset };
				// // bmp.data = d.slice(p, p+z);
				// let img: RImage = {
				// 	'metadata': bmp,
				// 	'data': parseBitmap(bmp.data)
				// };
				if (img.height > _h) _h = img.height;
				chars[++q] = img;
				// p += z;
				p += img.metadata.length + 32;
			}
			ret = chars.length;
			this.glyphs = chars;
			this._lineHeight = _h;
		}
		return ret;
	}
}

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
