/** Interface for generic widgets */
export interface NWidget {
	// TODO
	/** Subscribe an element to watch this widget */
	subscribe: (el: HTMLElement) => void;
	/** Unsubscribe an element from watching this widget */
	unsubscribe: (el: HTMLElement) => void;
	/** Find the index of a given subscriber if it's in the list */
	subscriber: (el: HTMLElement) => number;
	/** Build the element representation of this widget */
	build: () => HTMLElement | void;
}