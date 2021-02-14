import * as LX from "./consts";

import { RColor } from "../formats/rpg.internal";
import { BlendFunction, Color } from "../formats/color";
import { NWidget } from "./widget";
import { Grid } from "./grid";

// const E = document.createElement.bind(document);

// TODO: REFACTOR move Grid out to canvas implementation (ie: NCanvas) +asr 20200826

export class Palette<T extends RColor> implements NWidget {
	private _subscribers: HTMLElement[];

	private _id: string;
	private _swatches: T[] = [];
	private _grid: Grid;

	constructor(rows: number, cols: number, zoom: number = 1) {
		this._subscribers = [];
		// TODO
		this._id = LX.ID_PAL_WR_DEF;
		this._grid = Grid.create(cols, rows);
		this._grid.container.classList.add(LX.CL_PAL_WR);
		this.zoom = zoom;
		this.init();
	}

	/** Grid container element */
	public get container(): HTMLElement { return this._grid.container; }
	/** Palette count */
	public get length(): number { return this._swatches.length; }

	/** Set palette instance ID */
	public set id(v: string) {
		this._id = v;
		this._grid.id = `${this._id}-grid`;
	}
	/** Set grid 2D scale factor */
	public set zoom(z: number) { this._grid.zoom = z; }

	public subscribe(el: HTMLElement): void {
		let i = this.subscriber(el);
		if (i < 0) this._subscribers.push(el);
	}
	public unsubscribe(el: HTMLElement): void {
		let i = this.subscriber(el);
		if (i > -1) this._subscribers.splice(i, 1);
	}
	public subscriber(el: HTMLElement): number {
		return this._subscribers.findIndex((it) => (it === el));
	}
	public build(): HTMLElement {
		return this._grid.build();
	}

	public init(): void {
		this._grid.container.addEventListener("mouseup", this.mouseup.bind(this));
	}
	public select(i: number): T {
		if (i < 0 || i >= this._swatches.length) return Color.transparent();
		else return { ...this._swatches[i] };
	}
	public add(...c: T[]): void {
		// TODO: confirm add if color already in palette
		// for (let _c of c) this._add(_c);
		this._addBulk(...c);
	}
	public blend(c1: T, c2: T, fn: BlendFunction<T>): T {
		let ret: T = fn(c1, c2);
		return ret;
	}
	private _addBulk(...c: T[]): void {
		for (let _c of c) this._swatches.push({ ..._c });
		this._update();
	}
	private _add(c: T): void {
		this._swatches.push({ ...c });
		let i = this._swatches.length - 1;
		if (i > -1) {
			let y = (i / this._grid.width) | 0, x = i % this._grid.width;
			this._grid.plot(x, y, c);
			console.log("LX::PAL", "add", c, i, x, y);
		}
		// this._update();
	}
	private _update(): void {
		// TODO: refresh grid with current colors
		// console.log("LX::PAL", "upd");
		this._grid.clear();
		let w = this._grid.width, h = this._grid.height;
		let x = 0, y = 0;
		for (let c of this._swatches) {
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
		ev.preventDefault();
		let mx = ev.offsetX;
		let my = ev.offsetY;
		let cx = Number(this._grid.container.style.getPropertyValue(LX.CSS_MOUSE_X)) | 0;
		let cy = Number(this._grid.container.style.getPropertyValue(LX.CSS_MOUSE_Y)) | 0;
		// TODO: translate to palette item
		console.log("LX::Palette", "mouseup", ev.button, mx, my, cx, cy);
		let i = cy * this._grid.width + cx;
		if (i < 0) return;
		else {
			let det: any = {
				"detail": {
					"src": this,
					"index": i,
					"layer": ev.button
				}
			};
			for (let el of this._subscribers) {
				el.dispatchEvent(new CustomEvent(LX.EV_PALETTESELECT, det));
			}
			// TODO: dispatch this.select(i) to somewhere
			// this.container.dispatchEvent(new CustomEvent("lxSelect", det));
		}
	}
}