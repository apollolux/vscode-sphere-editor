import { RColor } from "../formats/rpg.internal";

const E = document.createElement.bind(document);

/** Canvas wrapper */
export class NCanvas {
	public static create(): NCanvas {
		let c = E('canvas');
		return new NCanvas(c);
	}

	private _zoom: number = 1;
	private _width: number = -1;
	private _height: number = -1;
	private _colors: Map<string, RColor> = new Map<string, RColor>();
	private _gui: Map<string, HTMLElement> = new Map<string, HTMLElement>();
	private _palette: RColor[] = [];

	constructor(
		private _element: HTMLCanvasElement
	) {
		// TODO
		this._colors.set("foreground", { "red": 255, "green": 255, "blue": 255, "alpha": 255 });
		this._colors.set("background", { "red": 0, "green": 0, "blue": 0, "alpha": 0 });
	}

	/** Underlying canvas element */
	public get element(): HTMLCanvasElement { return this._element; }
	/** Pixel width of source image */
	public get width(): number { return this._width; }
	/** Pixel height of source image */
	public get height(): number { return this._height; }
	// /** Currently active foreground color */
	// public get foreground(): RColor { return this._colors.get("foreground"); }
	// /** Currently active background color */
	// public get background(): RColor { return this._colors.get("background"); }
}