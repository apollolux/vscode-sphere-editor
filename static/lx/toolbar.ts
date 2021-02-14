import * as LX from "./consts";
import { NWidget } from "./widget";
import { Action } from "./action";

const E = document.createElement.bind(document);

export type ToolbarControl = HTMLButtonElement | HTMLInputElement | HTMLSelectElement | NWidget;

export interface ToolbarItem {
	label: string;
	element: ToolbarControl;
	action: Action;
}

/** Pixel editing tools container */
export class Toolbar implements NWidget {
	private _subscribers: HTMLElement[];

	private _id: string;
	private _wrapper: HTMLElement;
	private _items: Map<string, ToolbarItem>;

	constructor(id: string) {
		this._subscribers = [];
		// TODO
		this._wrapper = E(LX.EL_TOOLBAR);
		this._id = id || LX.ID_TOOLBAR_DEF;
		this._wrapper.id = `${this._id}-wr`;
		this._wrapper.classList.add(LX.CL_TOOLBAR_WR);
		this._wrapper.dataset['lx'] = LX.ATTR_TOOLBAR;
		this._items = new Map<string, ToolbarItem>();
	}

	/** Container element */
	public get container(): HTMLElement { return this._wrapper; }

	/** Set grid instance ID */
	public set id(v: string) {
		this._id = this._wrapper.id = v;
	}
	
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
		return this._wrapper;
	}

	public add(k: string, it: ToolbarItem): void {
		let c = this._items.get(k);
		if (c) {
			c.label = it.label;
			c.element = it.element;
			c.action = it.action;
			// TODO: queue refreshing item's visuals
		}
		else {
			this._items.set(k, it);
			// TODO: queue append/full rebuild
		}
	}
}
