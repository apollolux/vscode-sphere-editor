import { RColor } from "../formats/rpg.internal";
import { BlendFunction, Color } from "../formats/color";
import { Grid } from "./grid";

// const E = document.createElement.bind(document);

export class Palette {
	private _id: string;
	private _palette: RColor[] = [];
	private _grid: Grid;

	constructor(rows: number, cols: number, zoom: number = 1) {
		// TODO
		this._id = "lx-palette-default-id";
		this._grid = Grid.create(cols, rows);
		this._grid.container.classList.add("lx-pal-wr");
		this.zoom = zoom;
		this.init();
	}

	/** Grid container element */
	public get container(): HTMLElement { return this._grid.container; }
	/** Palette count */
	public get length(): number { return this._palette.length; }

	/** Set palette instance ID */
	public set id(v: string) {
		this._id = v;
		this._grid.id = `${this._id}-grid`;
	}
	/** Set grid 2D scale factor */
	public set zoom(z: number) { this._grid.zoom = z; }

	public init(): void {
		this._grid.container.addEventListener("mouseup", this.mouseup.bind(this));
	}
	public select(i: number): RColor {
		if (i < 0 || i >= this._palette.length) return Color.transparent;
		else return { ...this._palette[i] };
	}
	public add(...c: RColor[]): void {
		// TODO: confirm add if color already in palette
		// for (let _c of c) this._add(_c);
		this._addBulk(...c);
	}
	public blend(c1: RColor, c2: RColor, fn: BlendFunction): RColor {
		let ret: RColor = fn(c1, c2);
		return ret;
	}
	private _addBulk(...c: RColor[]): void {
		for (let _c of c) this._palette.push({ ..._c });
		this._update();
	}
	private _add(c: RColor): void {
		this._palette.push({ ...c });
		let i = this._palette.length - 1;
		if (i > -1) {
			let y = (i / this._grid.width) | 0, x = i % this._grid.width;
			this._grid.plot(x, y, c);
			console.log("LX::PAL", "add", c, i, x, y);
		}
		// this._update();
	}
	private _update(): void {
		// TODO: refresh grid with current colors
		console.log("LX::PAL", "upd");
		this._grid.clear();
		let w = this._grid.width, h = this._grid.height;
		let x = 0, y = 0;
		for (let c of this._palette) {
			this._grid.plot(x, y, c);
			++x;
			if (x >= w) ++y, x = 0;
			// TODO: break if can't scroll
			if (y >= h) break;
		}
	}
	private _resize(w: number, h: number): void {
		// TODO: resize grid with new size, possible scrolling
		this._grid.resize(w, h);
		this._update();
	}
	/** Click handler */
	private mouseup(ev: MouseEvent): void {
		let mx = ev.offsetX;
		let my = ev.offsetY;
		let cx = Number(this._grid.container.style.getPropertyValue("--mouse-x")) | 0;
		let cy = Number(this._grid.container.style.getPropertyValue("--mouse-y")) | 0;
		// TODO: translate to palette item
		console.log("LX::Palette", "mouseup", ev.button, mx, my, cx, cy);
		let i = cy * this._grid.width + cx;
		if (i < 0) return;
		else {
			// TODO: dispatch this.select(i) to somewhere
			this.container.dispatchEvent(new CustomEvent("lxSelect", {
				"detail": {
					"index": i,
					"layer": ev.button
				}
			}));
		}
	}
}