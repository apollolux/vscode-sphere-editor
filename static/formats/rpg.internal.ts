/** Interface for colors */
interface IColor {
	[channel: string]: number;
}

/** Interface for colors with an alpha channel */
export interface RColor extends IColor {
	[channel: string]: number;
	/** Alpha value, 0 - 255 */
	alpha: number;
}

/** Interface for RGB (0-255) */
export interface RColorRGB extends IColor {
	[channel: string]: number;
	/** Red value, 0 - 255 */
	red: number;
	/** Green value, 0 - 255 */
	green: number;
	/** Blue value, 0 - 255 */
	blue: number;
}

/** Type for RGBA (0-255) */
export type RColorRGBA = RColor & RColorRGB;

/** Interface for CMYK (0-100) */
export interface RColorCMYK extends IColor {
	[channel: string]: number;
	/** Cyan value, 0 - 100 */
	cyan: number;
	/** Magenta value, 0 - 100 */
	magenta: number;
	/** Yellow value, 0 - 100 */
	yellow: number;
	/** Black value, 0 - 100 */
	black: number
}

/** Type for CMYK (0-100) */
export type RColorCMYKA = RColor & RColorCMYK;

interface RColorHS extends IColor {
	[channel: string]: number;
	/** Hue value, 0 - 360 */
	hue: number;
	/** Saturation value, 0 - 100 */
	saturation: number;
}
/** Interface for HSL */
export interface RColorHSL extends IColor, RColorHS {
	[channel: string]: number;
	/** Lightness value, 0 - 100 */
	lightness: number;
}
/** Type for HSL */
export type RColorHSLA = RColor & RColorHSL;
/** Interface for HSV */
export interface RColorHSV extends IColor, RColorHS {
	[channel: string]: number;
	/** Value maximum, 0 - 100 */
	value: number;
}
/** Type for HSV */
export type RColorHSVA = RColor & RColorHSV;

export type RColorX = RColor & (
	RColorRGBA | RColorCMYKA | RColorHSLA | RColorHSVA
);