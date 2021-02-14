import * as LX from "./consts";

import { RColorRGBA } from "../formats/rpg.internal";
import { Color } from "../formats/color";
import { NWidget } from "./widget";

// use https://casesandberg.github.io/react-color/ ?
// need: swatch, channel[]
// need(Win): paletteGrid, gradient2D{x = hue, y = saturation}, gradientVert{lightness}, channel[] as input[type=number]
// need(PS): gradient2D{x = saturation, y = lightness}, gradientVert{hue}, swatch | channel[]
// need(Chr): gradient2D{x = saturation, y = lightness} | swatch | gradientHor{hue} , gradientHor{alpha} | channel[] | formatswitcher

const E = document.createElement.bind(document);

type PickerLayout = "normal" | "chrome" | "win32";

/** Widget for picking RGBA colors */
export class Colorpicker<T extends RColorRGBA> implements NWidget {
	private _subscribers: HTMLElement[];
	private _current: T;
	private readonly _original: T;
	private _keys: (keyof RColorRGBA)[];
	private _form: HTMLFormElement;
	private _actions: Map<string, HTMLElement>;
	private _swatch: HTMLOutputElement;
	private _layout: PickerLayout;

	constructor(color?: T) {
		this._subscribers = [];
		this._current = color || Color.transparent();
		this._original = { ...this._current };
		this._keys = Object.keys(this._current);
		this._layout = "normal";
		// widget form
		this._form = E(LX.EL_COLORPICKER);
		this._form.dataset["lx"] = "colorpicker";
		// colorpicker preview swatch
		this._swatch = E('output');
		this._swatch.name = "swatch";
		// widget actions
		this._actions = new Map<string, HTMLElement>();
	}

	public get value(): T { return { ...this._current }; }

	public set layout(v: PickerLayout) { this._layout = v; }

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
		this._form.style.setProperty(LX.CSS_WIDGET_COLOR_CHANNELS, `${this._keys.length}`);
		this._form.append(this._swatch);
		// color channels
		for (let k of this._keys) {
			// rebuild labeled container
			let sel_label = `label[data-lx="color.${k}"]`;
			let sel_span = `span[data-lx="${LX.ATTR_FORM_CTRL_LABEL}"]`;
			let sel_inp = `input[name="${k}"]`;
			// control's container label
			let _label: HTMLLabelElement = this._form.querySelector(sel_label) || E('label');
			_label.dataset["lx"] = `color.${k}`;
			// control's text label
			let _sp: HTMLSpanElement = _label.querySelector(sel_span) || E('span');
			_sp.dataset["lx"] = LX.ATTR_FORM_CTRL_LABEL;
			_sp.textContent = `${k}`;
			// TODO: make input el
			let _inp: HTMLInputElement = _label.querySelector(sel_inp) || E('input');
			_inp.type = "range";
			_inp.name = `${k}`;
			_inp.dataset["lx"] = "channel";
			_inp.setAttribute("min", "0");
			_inp.setAttribute("max", "255");
			_inp.setAttribute("step", "1");
			_inp.setAttribute("value", `${this._current[k]}`);
			this._form.style.setProperty(`--swatch-color-${k}`, `${_inp.value}`);
			// TODO
			_label.append(_inp, _sp);
			this._form.append(_label);
		}
		// widget action row
		let btn_reset: HTMLButtonElement = (this._actions.get("reset") || E('button')) as HTMLButtonElement;
		btn_reset.name = "reset";
		btn_reset.type = "reset";
		btn_reset.textContent = "Reset";
		let btn_submit: HTMLButtonElement = (this._actions.get("submit") || E('button')) as HTMLButtonElement;
		btn_submit.name = "submit";
		btn_submit.type = "submit";
		btn_submit.textContent = "OK";
		let ftr: HTMLElement = this._form.querySelector(`footer[data-lx="${LX.ATTR_FORM_FTR}"]`) || E('footer');
		ftr.dataset["lx"] = LX.ATTR_FORM_FTR;
		ftr.append(btn_reset, btn_submit);
		this._form.append(ftr);
		// listeners
		this._form.addEventListener("input", this.input.bind(this));
		this._form.addEventListener("reset", this.reset.bind(this));
		this._form.addEventListener("submit", this.submit.bind(this));
		return this._form;
	}
	private input(ev: Event): void {
		// if any channel updated
		let el = ev.target as HTMLInputElement;
		if (el && el.form) {
			let ch: (keyof T) = el.name;
			let v: number = Number(el.value);
			if (!(ch in this._current)) {
				// TODO
			}
			else if (this._current[ch] !== v) {
				this._current[ch] = v as T[keyof T];
				// update preview visuals
				el.form.swatch.value = Color.toHex(this._current, false);
				el.form.style.setProperty(`--swatch-color-${ch}`, `${v}`);
			}
		}
	}
	private reset(ev: Event): void {
		// TODO: either emit original value or just esc
		ev.preventDefault();
	}
	private submit(ev: Event): void {
		// TODO: somehow emit the final value
		ev.preventDefault();
		for (let el of this._subscribers) el.dispatchEvent(new CustomEvent(LX.EV_COLORPICK, {
			"detail": {
				"color": this._current
			}
		}));
	}
}