/**
 * lx/canvas.ts
 * Editing canvas widget for graphical bitmap editors
 * @author Alex Rosario
 */

/*
NCanvas aims to provide the following:

*	Viewport grid for bitmap
	*	read/write
	*	zoomable
	*	scrollable
	*	sizable?
		TODO: decide how to present resize operation (dialog?)
*	Toolbar/toolbox for bitmap operation buttons
	*	sizable?
	*	dockable?
*	Palette for selectable colors
	*	sizable?
	*	zoomable
	*	scrollable?
	*	dockable?

NCanvas aims to handle the following user events:

*	Contextual left click
	*	on viewport: perform tool action
	*	on toolbar: select tool
	*	on palette: select color
*	Contextual right click
	*	on viewport: Sphere bitmap editor contextmenu actions?
	*	on toolbar: toolbar contextmenu actions?
	*	on palette: palette color contextmenu actions?
*	Contextual middle click?
*	Contextual scroll
	*	on viewport: scroll viewport grid
		*	<mod>+scroll: zoom?
	*	on toolbar: ???
	*	on palette: scroll palette grid
		*	<mod>+scroll: zoom?
*	Key
	*	Arrow keys: ACTION<nudge/offset>

NCanvas aims to handle the following tools/actions:

*	Undo/redo/history
	*	attempt to hook into vsc-ext doc-edit history functionality
*	Cut/copy/paste
	*	cut: selection = cut selection, no selection = cut whole canvas
	*	copy: selection = copy selection, no selection = copy whole canvas
	*	paste: selection = try to paste into selection (use "paste into" setting?), no selection = try to paste onto whole canvas (use replace/blend setting?)
*	Nudge/offset
	*	nudge viewport X px (use nudge fine setting?)
	*	<mod>+arrow: nudge viewport M px (use nudge coarse setting?)
	*	use offset clip/wrap setting?
*	Replace color
	*	replace all instances of old RGB(A) with new RGB(A)
*	Pencil / Erase
	*	opacity?
	*	blend mode?
	*	sizable
	*	selected channel(s) only?
*	Brush / Erase
	*	sizable
*	Spray
	*	randomness amt?
	*	distribution method?
	*	sizable
*	(Erase)
*	Bucket
	*	connected only vs unconnected
	*	connection tolerance?
	*	selected channel(s) only?
*	Line
	*	sizable? (stroke)
	*	smooth/antialiased?
*	Polygon
	*	sizable? (stroke)
	*	connection threshold?
	*	smooth/antialiased?
*	Rect
	*	sizable (dim)
	*	sizable? (stroke)
	*	fill+stroke mode
	*	corner mode?
*	Ellipse
	*	sizable (dim)
	*	sizable? (stroke)
	*	fill+stroke mode
*	Select : lassopoly
	*	sizable (dim)
	*	sizable? (stroke/feather)
	*	connection threshold?
	*	smooth/antialiased?
*	Select : lassorect
	*	sizable (dim)
	*	sizable? (stroke/feather)
*	Colorpick/eyedrop
	*	sizable?
	*	averaging method if sizable?

NCanvas aims to receive the following on-page non-canvas external user events:

*	select bitmap
	*	a bitmap to edit is chosen from a list of bitmaps
	*	current work is stored
	*	chosen bitmap replaces canvas, resizes if necessary
*	select color
	*	a color is picked external of the viewport and palette
	*	chosen color replaces fg color
	*	prompt adding to palette?
*	update preview
	*	a preview widget or list of bitmaps requests newest data in order to update visuals
	*	current work is sent to requestor

*/

import * as LX from "./consts";

import { RColor, RColorRGBA } from "../formats/rpg.internal";
import { Color } from "../formats/color";
import { NWidget } from "./widget";
import { Action } from "./action";
import { Grid } from "./grid";
import { Palette } from "./palette";
import { Toolbar, ToolbarControl, ToolbarItem } from "./toolbar";
import { Colorpicker } from "./picker";

const E = document.createElement.bind(document);

// TODO: MAKE ACTIONS
const ACTIONS: Map<string, Action> = new Map<string, Action>();

/** Button-to-layer association */
const PAL_LAYERS = [LX.NC_LAYER_FG, LX.NC_LAYER_FG, LX.NC_LAYER_BG];
// 0 = left mouse button
// 1 = middle mouse button
// 2 = right mouse button

// toolbar controls
const CTRLS: Map<string, ToolbarControl> = new Map<string, ToolbarControl>();
// edit controls
CTRLS.set("pencil", E("button"));
CTRLS.set("brush", E("button"));
CTRLS.set("spray", E("button"));
CTRLS.set("erase", E("button"));
CTRLS.set("bucket", E("button"));
CTRLS.set("line", E("button"));
CTRLS.set("polygon", E("button"));
CTRLS.set("rect", E("button"));
CTRLS.set("ellipse", E("button"));
// select controls
CTRLS.set("lassopoly", E("button"));
CTRLS.set("lassorect", E("button"));
CTRLS.set("eyedrop", E("button"));

/*
TOOLS:
# mspaint #
polylasso	rectlasso
erase	bucket
eyedrop	lens
pencil	brush
spraycan	text
line	curve
rect	polygon
ellipse	roundedrect
tool-specific
...
fg-bg swatch	palette

# paintbrush.app #
brush	erase
rectlasso	spraycan
bucket	bomb
line	curve
rect	ellipse
roundedrect	text
eyedrop	lens
...
tool-specific
...
stroke size
fg-bg swatch

ACTIONS:
flip/rotate
stretch/skew
invert
*/


// TODO: split palette Grid widget out of Palette into NCanvas +asr 20200826

/** Canvas wrapper */
export class NCanvas<T extends RColorRGBA> implements NWidget {
	// public static create(): NCanvas {
	// 	let c = E('canvas');
	// 	return new NCanvas(c);
	// }

	private _subscribers: HTMLElement[];

	private _id: string;
	// private _zoom: number = 1;
	// private _width: number = -1;
	// private _height: number = -1;
	private _colors: Map<string, T> = new Map<string, T>();
	// private _gui: Map<string, HTMLElement> = new Map<string, HTMLElement>();
	private _wrapper: HTMLElement;
	private _canvas: Grid;
	private _palette: Palette<T>;
	private _toolbar: Toolbar;
	private _picker: Colorpicker<T>;
	private _dialog: HTMLDialogElement;

	constructor(
		// private _element: HTMLCanvasElement
		w: number, h: number
	) {
		this._subscribers = [];
		this._wrapper = E(LX.EL_NCANVAS);
		this._wrapper.classList.add(LX.CL_NCANVAS_WR);
		this._id = LX.ID_NCANVAS_DEF;
		this._canvas = Grid.create(w, h);
		this._palette = new Palette<T>(4, 2, 32);
		this._palette.add(
			Color.transparent(),
			// { "red": 255, "green": 255, "blue": 255, "alpha": 255 },
			// { "red": 128, "green": 192, "blue": 255, "alpha": 160 },
		);
		this._picker = new Colorpicker<T>();
		this._toolbar = new Toolbar(`${this._id}-toolbar`);
		// TODO: move dialog to its own module DialogHandler?
		this._dialog = E('dialog');
		this._dialog.dataset["lx"] = "ncanvas-dialog";
		// TODO
		this.init();
	}

	/** Widget container element */
	public get container(): HTMLElement { return this._wrapper; }
	/** Underlying canvas container */
	public get canvas(): Grid { return this._canvas; }
	/** Underlying canvas element */
	public get element(): HTMLCanvasElement { return this._canvas.element; }
	/** Underlying palette container */
	public get palette(): Palette<T> { return this._palette; }

	/** Widget id */
	public set id(v: string) {
		this._id = v;
		this._wrapper.id = this._id;
		this._canvas.id = `${this._id}-canvas`;
		this._palette.id = `${this._id}-pal`;
		this._toolbar.id = `${this._id}-toolbar`;
	}
	/** Set canvas 2D scale factor */
	public set zoom(v: number) { this._canvas.zoom = v; }

	// /** Pixel width of source image */
	// public get width(): number { return this._width; }
	// /** Pixel height of source image */
	// public get height(): number { return this._height; }
	// /** Currently active foreground color */
	// public get foreground(): RColor { return this._colors.get(LX.NC_LAYER_FG); }
	// /** Currently active background color */
	// public get background(): RColor { return this._colors.get(LX.NC_LAYER_BG); }

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
		// return this._grid.build();
		this._wrapper.append(this._canvas.build(), this._palette.build(), this._dialog);
		this._dialog.append(this._picker.build());
		return this._wrapper;
	}


	public init(): void {
		// TODO
		// this._colors.set(LX.NC_LAYER_FG, { "red": 255, "green": 255, "blue": 255, "alpha": 255 });
		// this._colors.set(LX.NC_LAYER_BG, { "red": 0, "green": 0, "blue": 0, "alpha": 0 });
		this.selectColor(0, LX.NC_LAYER_FG);
		this.selectColor(0, LX.NC_LAYER_BG);
		this._canvas.container.addEventListener("mouseup", (ev: MouseEvent) => {
			// TODO
			// let mx = ev.offsetX;
			// let my = ev.offsetY;
			let i = +(this._wrapper.dataset['sphGlyph'] || 0);
			let cx = Number(this._canvas.container.style.getPropertyValue(LX.CSS_MOUSE_X)) | 0;
			let cy = Number(this._canvas.container.style.getPropertyValue(LX.CSS_MOUSE_Y)) | 0;
			let c: RColor = this._colors.get(PAL_LAYERS[ev.button]) || Color.transparent();
			let det: any = {
				"detail": {
					"src": this,
					"index": i,
					"x": cx,
					"y": cy,
					"color": c
				}
			};
			this._canvas.plot(cx, cy, c);
			// TODO: send glyph-update to selected glyph in glyphlist via subscribers
			for (let el of this._subscribers) {
				el.dispatchEvent(new CustomEvent(LX.EV_CANVASUPDATE, det));
			}
		});
		this._wrapper.addEventListener(LX.EV_PALETTESELECT, (ev: Event) => {
			let detail = (ev as CustomEvent).detail;
			let i = Number(detail.index);
			let layer = detail.layer;
			this.selectColor(i, PAL_LAYERS[layer]);
		});
		this._wrapper.addEventListener(LX.EV_COLORPICK, (ev: Event) => {
			let detail = (ev as CustomEvent).detail;
			let act = detail.action || "add";
			let col = detail.color;
			console.log("LX::NC", "PICK", act, col);
			if (!col || !act) {
				// TODO: no color, cancel
			}
			else if (act === "edit") {
				// TODO: change palette at index i to new color
			}
			else if (act === "add") {
				// TODO: add new color to palette
				this._palette.add(col);
			}
		});
		this._palette.subscribe(this._wrapper);
		this._picker.subscribe(this._wrapper);
		this._wrapper.addEventListener("mouseup", this.mouseup.bind(this));
	}
	public selectColor(i: number, layer: string = LX.NC_LAYER_FG): void {
		// TODO
		if (i >= this._palette.length) {
			// TODO: prompt color add
			console.log("LX::NC", "pal", i, "prompt");
		}
		let c: T = this._palette.select(i);
		this._colors.set(layer, c);
		if (layer === LX.NC_LAYER_FG) this._canvas.container.style.setProperty(LX.CSS_CURSOR_FG, Color.toCSS(c));
		else if (layer === LX.NC_LAYER_BG) this._canvas.container.style.setProperty(LX.CSS_CURSOR_BG, Color.toCSS(c));
	}

	private mouseup(ev: MouseEvent): void {
		ev.preventDefault();
		console.log("LX::NC", "mouseup", ev.type, (ev?.target as HTMLElement)?.nodeName);
	}
}