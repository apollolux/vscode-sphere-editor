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

// /** Interface for parsed Sphere bitmap images */
// export interface RImage {
// 	/** Image metadata */
// 	metadata: RBitmap;
// 	/** Bitmap pixel data as RGBA */
// 	data: RColor[];
// }

export class RImage {
	private _cached: Map<number, RColor>;
	private _canvas: OffscreenCanvas;
	constructor(
		private _bitmap: RBitmap
	) {
		// TODO
		this._canvas = new OffscreenCanvas(this.width, this.height);
		this._cached = new Map<number, RColor>();
		this.rebuildCache();
	}

	public get width(): number { return this._bitmap.width; }
	public get height(): number { return this._bitmap.height; }
	public get metadata(): any | undefined { return this._bitmap.metadata; }
	public get raw(): Uint8Array { return this._bitmap.data; }

	public at(x: number, y: number, refresh: boolean = false): RColor {
		let ret: RColor = { "red": 0, "green": 0, "blue": 0, "alpha": 0 };
		if (x < 0 || y < 0 || x >= this._bitmap.width || y >= this._bitmap.height) return ret;
		let i = (y * this._bitmap.width + x), z = i << 2;
		if (z >= this._bitmap.data.length) return ret;
		if (refresh || !this._cached.has(i)) {
			ret.red = this._bitmap.data[z + 0];
			ret.green = this._bitmap.data[z + 1];
			ret.blue = this._bitmap.data[z + 2];
			ret.alpha = this._bitmap.data[z + 3];
			this._cached.set(i, ret);
		}
		else {
			let px = this._cached.get(i);
			if (px) ret = px;
		}
		return ret;
	}
	public blitTo(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, x: number, y: number, sx: number = 1, sy: number = 1): void {
		// TODO
		// console.log("LX::IMG", "blit", x, y, this.width, this.height, sx, sy);
		// let sm = ctx.imageSmoothingEnabled;
		// ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this._canvas, x, y, sx * this.width, sy * this.height);
		// ctx.imageSmoothingEnabled = sm;
	}
	public rebuildCache(): void {
		let ctx = this._canvas.getContext('2d');
		let data = ctx?.createImageData(this.width, this.height);
		let i = 0, z = 0; while (z < this._bitmap.data.length) {
			let px: RColor | undefined = this._cached.get(i);
			if (!px) px = {
				"red": 0,
				"green": 0,
				"blue": 0,
				"alpha": 0
			};
			px.red = this._bitmap.data[z + 0];
			px.green = this._bitmap.data[z + 1];
			px.blue = this._bitmap.data[z + 2];
			px.alpha = this._bitmap.data[z + 3];
			if (data) {
				data.data[z + 0] = this._bitmap.data[z + 0];
				data.data[z + 1] = this._bitmap.data[z + 1];
				data.data[z + 2] = this._bitmap.data[z + 2];
				data.data[z + 3] = this._bitmap.data[z + 3];
			}
			this._cached.set(i, px);
			z += 4;
			++i;
		}
		if (ctx && data) {
			ctx.imageSmoothingEnabled = false;
			ctx.putImageData(data, 0, 0);
		}
	}
}

export function blitTo(ctx: CanvasRenderingContext2D, img: RImage, x: number, y: number, sx: number = 1, sy: number = 1): void {
	// TODO
	// let bmp = img.metadata;
	let w = img.width, h = img.height;
	console.log("LX::SPH", "BLIT", x, y, w, h, img.raw.length);
	let oc = new OffscreenCanvas(w, h);
	let ot = oc.getContext('2d');
	if (!ot) throw new Error("Error getting imagedata");
	let data = ot.createImageData(w, h);
	if (!data) throw new Error("Error getting imagedata");
	let _x = 0, _y = 0;
	let i = 0; while (i < data.data.length) {
		// let px = img.data[q];
		let px = img.at(_x, _y);
		data.data[i + 0] = px.red;
		data.data[i + 1] = px.green;
		data.data[i + 2] = px.blue;
		data.data[i + 3] = px.alpha;
		i += 4;
		// ++q;
		++_x; if (_x >= w) ++_y, _x = 0;
	}
	ot.putImageData(data, x, y);
	ctx.drawImage(oc, x, y, sx * w, sy * h);
}
export function imageToElement(img: RImage): HTMLCanvasElement {
	// TODO
	let c = document.createElement('canvas');
	c.width = img.metadata.width;
	c.height = img.metadata.height;
	let ctx = c.getContext('2d');
	if (!ctx) throw new Error("Error getting canvas context");
	blitTo(ctx, img, 0, 0);
	return c;
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
