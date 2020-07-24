/** Interface for Sphere colors */
export interface RColor {
	red: number;
	green: number;
	blue: number;
	alpha: number;
}

/** Namespace for color functions */
export class Color {
	public static get transparent(): RColor {
		return {
			"red": 0,
			"green": 0,
			"blue": 0,
			"alpha": 0
		};
	}
}