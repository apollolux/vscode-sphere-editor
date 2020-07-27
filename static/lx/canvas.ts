import { RColor } from "../formats/rpg.internal";
import { Color } from "../formats/color";
import { Grid } from "./grid";
import { Palette } from "./palette";

const E = document.createElement.bind(document);

const PAL_LAYERS = ["foreground", "foreground", "background"];

/** Canvas wrapper */
export class NCanvas {
	// public static create(): NCanvas {
	// 	let c = E('canvas');
	// 	return new NCanvas(c);
	// }

	private _id: string;
	// private _zoom: number = 1;
	// private _width: number = -1;
	// private _height: number = -1;
	private _colors: Map<string, RColor> = new Map<string, RColor>();
	// private _gui: Map<string, HTMLElement> = new Map<string, HTMLElement>();
	private _wrapper: HTMLElement;
	private _canvas: Grid;
	private _palette: Palette;

	constructor(
		// private _element: HTMLCanvasElement
		w: number, h: number
	) {
		this._wrapper = E('ncanvas');
		this._wrapper.classList.add("lx-ncanvas");
		this._id = "lx-canvas-default-id";
		this._canvas = Grid.create(w, h);
		this._palette = new Palette(4, 2, 32);
		this._palette.add(
			{ "red": 0, "green": 0, "blue": 0, "alpha": 0 },
			{ "red": 255, "green": 255, "blue": 255, "alpha": 255 },
			{ "red": 128, "green": 192, "blue": 255, "alpha": 160 },
		);
		this._wrapper.append(this._canvas.container, this._palette.container);
		// TODO
		this.init();
	}

	/** Widget container element */
	public get container(): HTMLElement { return this._wrapper; }
	/** Underlying canvas container */
	public get canvas(): Grid { return this._canvas; }
	/** Underlying canvas element */
	public get element(): HTMLCanvasElement { return this._canvas.element; }

	/** Widget id */
	public set id(v: string) {
		this._id = v;
		this._wrapper.id = this._id;
		this._canvas.id = `${this._id}-canvas`;
		this._palette.id = `${this._id}-pal`;
	}
	/** Set canvas 2D scale factor */
	public set zoom(v: number) { this._canvas.zoom = v; }

	// /** Pixel width of source image */
	// public get width(): number { return this._width; }
	// /** Pixel height of source image */
	// public get height(): number { return this._height; }
	// /** Currently active foreground color */
	// public get foreground(): RColor { return this._colors.get("foreground"); }
	// /** Currently active background color */
	// public get background(): RColor { return this._colors.get("background"); }

	public init(): void {
		// TODO
		this._colors.set("foreground", { "red": 255, "green": 255, "blue": 255, "alpha": 255 });
		this._colors.set("background", { "red": 0, "green": 0, "blue": 0, "alpha": 0 });
		this._canvas.container.addEventListener("mouseup", (ev: MouseEvent) => {
			// TODO
			// let mx = ev.offsetX;
			// let my = ev.offsetY;
			let cx = Number(this._canvas.container.style.getPropertyValue("--mouse-x")) | 0;
			let cy = Number(this._canvas.container.style.getPropertyValue("--mouse-y")) | 0;
			let c: RColor = this._colors.get(PAL_LAYERS[ev.button]) || Color.transparent;
			this._canvas.plot(cx, cy, c);
		});
		this._palette.container.addEventListener("lxSelect", (ev: Event) => {
			let detail = (ev as CustomEvent).detail;
			let i = Number(detail.index);
			let layer = detail.layer;
			this.selectColor(i, PAL_LAYERS[layer]);
		});
		this._wrapper.addEventListener("mouseup", this.mouseup.bind(this));
	}
	public selectColor(i: number, layer: string = "foreground"): void {
		// TODO
		if (i >= this._palette.length) {
			// TODO: prompt color add
		}
		let c: RColor = this._palette.select(i);
		this._colors.set(layer, c);
		if (layer === "foreground") this._canvas.container.style.setProperty("--cursor-color-fg", Color.toCSS(c));
		else if (layer === "background") this._canvas.container.style.setProperty("--cursor-color-bg", Color.toCSS(c));
	}

	private mouseup(ev: MouseEvent): void {
		ev.preventDefault();
		console.log("LX::NC", "mouseup", ev.type, (ev?.target as HTMLElement)?.nodeName);
	}
}