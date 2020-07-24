import { RColor, Color } from "../formats/rpg.internal";

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
	private _wrapper: HTMLElement;
	private _context: CanvasRenderingContext2D | null;
	private _helper: HTMLCanvasElement;
	private _buffer: OffscreenCanvas;
	private _data: ImageData;
	private _config: GridConfig;

	constructor(
		private readonly _element: HTMLCanvasElement
	) {
		this._context = this._element.getContext('2d');
		if (!this._context) throw new Error("Cannot create grid, no canvas context");
		this._wrapper = E('grid');
		this._wrapper.classList.add("lx-grid-wr");
		this._id = this._element.id || "lx-grid-default-id";
		this._wrapper.id = `${this._id}-wr`;
		this._helper = E('canvas');
		this._helper.id = `${this._id}-helper`;
		this._helper.classList.add("lx-canvas");
		this._helper.dataset['lx'] = "gridhelper";
		this._helper.width = this._element.width;
		this._helper.height = this._element.height;
		this._buffer = new OffscreenCanvas(this._element.width, this._element.height);
		this._element.classList.add("lx-canvas");	// .lx-canvas for CSS/querySelector
		this._wrapper.append(this._element, this._helper);
		// this._element.dataset["width"] = `${this._element.width}`;
		this._wrapper.style.setProperty("--pixel-width", `${this._element.width}`);
		// this._element.dataset["height"] = `${this._element.height}`;
		this._wrapper.style.setProperty("--pixel-height", `${this._element.height}`);
		this._data = this._context.getImageData(
			0, 0,
			this._element.width, this._element.height
		);
		// TODO
		this._config = { ...CFG_DEFAULT };
		this.init();
	}

	/** Underlying canvas element */
	public get element(): HTMLCanvasElement { return this._element; }
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
	/** Init the grid */
	public init(): void {
		if (this._context) {
			this.zoom = 1;
			this._context.imageSmoothingEnabled = this._config.imageSmoothingEnabled;
			if (this._config.showLines) this._wrapper.dataset['lxCfgShowLines'] = 'lines';
			else delete this._wrapper.dataset['lxCfgShowLines'];
			this._wrapper.addEventListener("mousemove", this.mousemove.bind(this));
			// this._element.addEventListener("mousemove", this.mousemove.bind(this));
			// this._helper.addEventListener("mousemove", this.mousemove.bind(this));
		}
	}
	/** Insert grid into given element */
	public appendTo(parent: HTMLElement): void {
		// parent.append(this._element, this._helper);
		parent.append(this._wrapper);
	}

	/** Clear the canvas */
	private clear(): void {
		// TODO: clear the canvas
	}
	/** Mousemove handler */
	private mousemove(ev: MouseEvent): void {
		let mx = ev.offsetX;
		let my = ev.offsetY;
		// TODO: translate to zoomed grid pos
		if (mx !== this._mouse.x || my !== this._mouse.y) {
			this._mouse.x = mx;
			this._mouse.y = my;
			let cx = (mx/this._scale.x) | 0;
			let cy = (my/this._scale.y) | 0;
			console.log("LX::Grid", "move", mx, my, cx, cy);
			this._wrapper.style.setProperty("--mouse-x", `${cx}`);
			this._wrapper.style.setProperty("--mouse-y", `${cy}`);
			// this._element.style.setProperty("--mouse-x", `${cx}`);
			// this._element.style.setProperty("--mouse-y", `${cy}`);
			// this._helper.style.setProperty("--mouse-x", `${cx}`);
			// this._helper.style.setProperty("--mouse-y", `${cy}`);
		}
	}
}