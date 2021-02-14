/**
 * lx/action.ts
 * Interface for hookable actions
 * @author Alex Rosario
 */


export interface Action {
	// TODO
	activate: (ev: Event | CustomEvent) => void;
}
