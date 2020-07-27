import { RColor } from "../formats/rpg.internal";
import { RImage } from "../formats/rpg.bitmap";
import { Color } from "../formats/color";

const E = document.createElement.bind(document);

interface Position {
	x: number;
	y: number;
	z?: number;
}

interface GridConfig {
	showLines: boolean;
	imageSmoothingEnabled: boolean;
}

const CFG_DEFAULT: GridConfig = {
	"showLines": true,
	"imageSmoothingEnabled": false
};

/** Canvas wrapper */
export class Grid {
	public static create(w: number, h: number): Grid {
		let c = E('canvas');
		c.width = w;
		c.height = h;
		return new Grid(c);
	}

	private _id: string;
	private _scale: Position = { "x": 1, "y": 1, "z": 1 };
	private _mouse: Position = { "x": -1, "y": -1, "z": 0 };
	private _mouse_adjusted: Position = { "x": -1, "y": -1, "z": 0 };
	private _wrapper: HTMLElement;
	private _context: CanvasRenderingContext2D | null;
	private _helper: HTMLCanvasElement;
	private _buffer: OffscreenCanvas;
	private _data: ImageData;
	private _config: GridConfig;
	// buffering
	private _updates: number[] = [];
	private _update_tid: number = 0;

	constructor(
		private readonly _element: HTMLCanvasElement
	) {
		this._context = this._element.getContext('2d');
		if (!this._context) throw new Error("Cannot create grid, no canvas context");
		this._buffer = new OffscreenCanvas(this._element.width, this._element.height);
		this._wrapper = E('grid');
		this._wrapper.classList.add("lx-grid-wr");
		this._id = this._element.id || "lx-grid-default-id";
		this._wrapper.id = `${this._id}-wr`;
		// this._element.dataset["width"] = `${this._element.width}`;
		this._wrapper.style.setProperty("--pixel-width", `${this._element.width}`);
		// this._element.dataset["height"] = `${this._element.height}`;
		this._wrapper.style.setProperty("--pixel-height", `${this._element.height}`);
		this._helper = E('canvas');
		this._helper.id = `${this._id}-helper`;
		this._helper.classList.add("lx-canvas");
		this._helper.dataset['lx'] = "gridhelper";
		this._helper.width = this._element.width;
		this._helper.height = this._element.height;
		this._element.classList.add("lx-canvas");	// .lx-canvas for CSS/querySelector
		this._wrapper.append(this._element, this._helper);
		let c = this._buffer.getContext('2d');
		if (!c) {
			this._data = this._context.getImageData(
				0, 0,
				this._element.width, this._element.height
			);
		}
		else {
			c.imageSmoothingEnabled = false;
			c.drawImage(_element, 0, 0);
			this._data = c.getImageData(
				0, 0,
				this._element.width, this._element.height
			);
		}
		// TODO
		this._config = { ...CFG_DEFAULT };
		this.init();
	}

	/** Underlying canvas element */
	public get element(): HTMLCanvasElement { return this._element; }
	/** Container element */
	public get container(): HTMLElement { return this._wrapper; }
	/** Pixel width of source image */
	public get width(): number { return this._data.width; }
	/** Pixel height of source image */
	public get height(): number { return this._data.height; }

	/** Set grid instance ID */
	public set id(v: string) {
		this._id = this._element.id = v;
		this._wrapper.id = `${this._id}-wr`;
		this._helper.id = `${this._id}-helper`;
	}
	/** Set grid 2D scale factor */
	public set zoom(n: number) {
		this.scaleX = n;
		this.scaleY = n;
	}
	/** Get grid scale-x factor */
	public get scaleX(): number { return this._scale.x; }
	/** Set grid scale-x factor */
	public set scaleX(n: number) {
		this._scale.x = n;
		this._wrapper.style.setProperty("--scale-x", `${n}`);
		// this._element.style.setProperty("--scale-x", `${n}`);
		// this._helper.style.setProperty("--scale-x", `${n}`);
	}
	/** Get grid scale-y factor */
	public get scaleY(): number { return this._scale.y; }
	/** Set grid scale-y factor */
	public set scaleY(n: number) {
		this._scale.y = n;
		this._wrapper.style.setProperty("--scale-y", `${n}`);
		// this._element.style.setProperty("--scale-y", `${n}`);
		// this._helper.style.setProperty("--scale-y", `${n}`);
	}

	/** Init the grid */
	public init(): void {
		if (this._context) {
			this.zoom = 1;
			this._context.imageSmoothingEnabled = this._config.imageSmoothingEnabled;
			if (this._config.showLines) this._wrapper.dataset['lxCfgShowLines'] = 'lines';
			else delete this._wrapper.dataset['lxCfgShowLines'];
			this._wrapper.addEventListener("lxUpdate", this.update.bind(this));
			this._wrapper.addEventListener("lxPlot", this.pixel.bind(this));
			this._wrapper.addEventListener("mousemove", this.mousemove.bind(this));
			// this._element.addEventListener("mousemove", this.mousemove.bind(this));
			// this._helper.addEventListener("mousemove", this.mousemove.bind(this));
		}
	}
	/** Get pixel at given position, transparent if non-existent */
	public at(x: number, y: number): RColor {
		let ret: RColor = Color.transparent;
		if (x < 0 || y < 0 || x >= this.width || y >= this.height) return ret;
		let i = (y * this.width + x), z = i << 2;
		if (z >= this._data.data.length) return ret;
		// TODO: cache?
		ret.red = this._data.data[z + 0];
		ret.green = this._data.data[z + 1];
		ret.blue = this._data.data[z + 2];
		ret.alpha = this._data.data[z + 3];
		return ret;
	}
	/** Plot a pixel onto the buffer and queue flipping within 5ms */
	public plot(x: number, y: number, c: RColor): void {
		// TODO: plot pixel
		if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
		this._wrapper.dispatchEvent(new CustomEvent("lxPlot", {
			"detail": {
				"x": x,
				"y": y,
				"color": c
			}
		}));
	}
	/** Blit an image onto the grid */
	public blitImage(img: RImage, x: number, y: number): void {
		// TODO
		let c = this._buffer.getContext('2d');
		if (c) {
			c.imageSmoothingEnabled = false;
			img.blitTo(c, x, y);
			this._data = c.getImageData(0, 0, this._data.width, this._data.height);
			this.flip();
		}
	}
	/** Insert grid into given element */
	public appendTo(parent: HTMLElement): void {
		// parent.append(this._element, this._helper);
		parent.append(this._wrapper);
	}
	/** Queue a refresh of canvas from buffer */
	public refresh(ms: number = 0): void {
		if (!this._update_tid && ms) {
			this._update_tid = window.setTimeout(this.update.bind(this), ms);
		}
		else this._wrapper.dispatchEvent(new CustomEvent("lxUpdate"));
	}
	/** Resize the visual canvas, leave buffer untouched */
	public resize(w: number, h: number): void {
		// TODO: resize, possibly scroll?
		this._element.width = w; this._element.height = h;
		this._helper.width = this._element.width;
		this._helper.height = this._element.height;
		this._wrapper.style.setProperty("--pixel-width", `${this._element.width}`);
		this._wrapper.style.setProperty("--pixel-height", `${this._element.height}`);
		if (this._element.width < this._data.width) {
			// TODO: horizontal scrolling?
		}
		if (this._element.height < this._data.height) {
			// TODO: vertical scrolling?
		}
	}
	/** Clear the canvas */
	public clear(): void {
		// TODO: clear the canvas
		let c = this._buffer.getContext('2d');
		if (c) {
			c.clearRect(0,0, this.width, this.height);
			// this.refresh();
		}
		if (this._context) {
			this._context.clearRect(0,0, this.width, this.height);
		}
	}

	/** Set a pixel */
	private pixel(ev: Event): void {
		let detail = (ev as CustomEvent).detail;
		let x: number = detail.x;
		let y: number = detail.y;
		let c: RColor = detail.color;
		let i = (y * this.width + x), z = i << 2;
		if (z < this._data.data.length) {
			console.log("LX::Grid", "pixel", ev.type, z, x, y, c);
			this._data.data[z + 0] = c.red;
			this._data.data[z + 1] = c.green;
			this._data.data[z + 2] = c.blue;
			this._data.data[z + 3] = c.alpha;
			this._updates.push(z);
			this.refresh();
		}
	}
	private flip(): void {
		// TODO: flip entire buffer to front
		if (this._context) {
			this._context.clearRect(0,0, this.width, this.height);
			this._context.putImageData(this._data, 0, 0);
		}
	}
	/** Update the visual canvas */
	private update(ev: Event): void {
		// TODO: flip dirty pixels to front
		if (this._context) {
			console.log("LX::Grid", "update", ev.type, this._updates.slice());
			let d = this._context.getImageData(0, 0, this.width, this.height);
			while (this._updates.length) {
				let z = this._updates.shift() || 0;
				d.data[z + 0] = this._data.data[z + 0];
				d.data[z + 1] = this._data.data[z + 1];
				d.data[z + 2] = this._data.data[z + 2];
				d.data[z + 3] = this._data.data[z + 3];
			}
			this._context.putImageData(d, 0, 0);
		}
		if (this._update_tid) this._update_tid = 0;
	}
	/** Mousemove handler */
	private mousemove(ev: MouseEvent): void {
		let mx = ev.offsetX;
		let my = ev.offsetY;
		this._mouse.x = mx;
		this._mouse.y = my;
		// TODO: translate to zoomed grid pos
		let cx = (mx/this._scale.x) | 0;
		let cy = (my/this._scale.y) | 0;
		// if (mx !== this._mouse.x || my !== this._mouse.y) {
		if (cx !== this._mouse_adjusted.x || cy !== this._mouse_adjusted.y) {
			this._mouse_adjusted.x = cx;
			this._mouse_adjusted.y = cy;
			// console.log("LX::Grid", "move", mx, my, cx, cy);
			this._wrapper.style.setProperty("--mouse-x", `${cx}`);
			this._wrapper.style.setProperty("--mouse-y", `${cy}`);
			// this._element.style.setProperty("--mouse-x", `${cx}`);
			// this._element.style.setProperty("--mouse-y", `${cy}`);
			// this._helper.style.setProperty("--mouse-x", `${cx}`);
			// this._helper.style.setProperty("--mouse-y", `${cy}`);
			// TODO: hook display of grid pos, px at pos?
			let c = this.at(cx, cy);
			this._wrapper.dataset["lxPos"] = `(${cx}, ${cy}, ${Color.toHex(c)})`;
		}
	}
}