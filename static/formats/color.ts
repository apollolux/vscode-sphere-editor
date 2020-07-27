import { RColor } from "./rpg.internal";

/** Interface for color blend functions */
export interface BlendFunction {
	(cBottom: RColor, cTop: RColor): RColor;
}


interface BlendCalculation {
	(cBottom: number, cTop: number): number;
}

interface BlendCalculations {
	[name: string]: BlendCalculation;
}

/** Channel max value */
const z = 255;
const zh = (z) >> 1;
/** Channel scale */
const _z = 1.0/z;

/** YIQ coefficients (Y) */
const Y_COEFF_Y = [0.299, 0.587, 0.114];
/** YIQ coefficients (I) */
const Y_COEFF_I = [0.596, 0.274, 0.322];
/** YIQ coefficients (Q) */
const Y_COEFF_Q = [0.211, 0.523, 0.312];

/** Convert given RGB to YIQ */
function _rgb_to_yiq(r: number, g: number, b: number): any {
	let ret: any = {};
	ret["y"] = (Y_COEFF_Y[0] * r + Y_COEFF_Y[1] * g + Y_COEFF_Y[2] * b) * _z;
	ret["i"] = (Y_COEFF_I[0] * r - Y_COEFF_I[1] * g - Y_COEFF_I[2] * b) * _z;
	ret["q"] = (Y_COEFF_Q[0] * r - Y_COEFF_Q[1] * g + Y_COEFF_Q[2] * b) * _z;
	return ret;
}

/** Convert given RGB to HSL */
function _rgb_to_hsl(r: number, g: number, b: number): any {
	let ret: any = {};
	let _min = Math.min(r, g, b), _max = Math.max(r, g, b);
	let _delta = _max - _min;
	ret["l"] = _z * 0.5 * (_max+_min);
	if (!_delta) {
		ret["h"] = 0;
		ret["s"] = 0;
	}
	else {
		let _r = r * _z, _g = g * _z, _b = b * _z;
		let _dr: number, _dg: number, _db: number;
		let _mn = _min * _z, _mx = _max * _z, _d = _delta * _z;
		if (ret["l"] < 0.5) ret["s"] = _d/(_mx+_mn);
		else ret["s"] = _d/(2-_mx-_mn);
		_dr = (((_mx-_r)/6)+0.5*_d)/_d;
		_dg = (((_mx-_g)/6)+0.5*_d)/_d;
		_db = (((_mx-_b)/6)+0.5*_d)/_d;
		if (r === _max) ret["h"] = (0) + _db - _dg;
		else if (g === _max) ret["h"] = (1/3.0) + _dr - _db;
		else if (b === _max) ret["h"] = (2/3.0) + _dg - _dr;
		if (ret["h"] < 0) ret["h"] += 1.0;
		if (ret["h"] > 1) ret["h"] -= 1.0;
	}
	return ret;
}

function _from_hue(v1: number, v2: number, vh: number): number {
	let _h = vh;
	if (_h < 0) _h += 1;
	if (_h > 1) _h -= 1;
	if (1 > 6*_h) return v1 + (v2-v1) * 6 * _h;
	if (1 > 2*_h) return v2;
	if (2 > 3*_h) return v1 + (v2-v1) * 6 * (2/3 - _h);
	return v1;
}
/** Convert given HSL to RGB */
function _hsl_to_rgb(h: number, s: number, l: number, a: number = 255): RColor {
	let ret: RColor = Color.transparent;
	if (!s) {
		ret["red"] = l * z;
		ret["green"] = l * z;
		ret["blue"] = l * z;
	}
	else {
		let _2 = l < 0.5 ? l*(1+s) : (l+s) - s*l;
		let _1 = 2 * l - _2;
		ret["red"] = z * _from_hue(_1, _2, h+(1/3));
		ret["green"] = z * _from_hue(_1, _2, h+(0));
		ret["blue"] = z * _from_hue(_1, _2, h-(1/3));
	}
	ret["alpha"] = a;
	return ret;
}

/** Luminance offset */
const L_OFFSET = 0.055;
/** Luminance value threshold */
const L_THRESHOLD = 0.03928;
/** Luminance scale (gamma adjusted) */
const L_SCALE_ADJ = 1/(1+L_OFFSET);
/** Luminance scale (non-adjusted) */
const L_SCALE_RAW = 1/12.92;
/** Luminance coefficient (red) */
const L_COEFF_R = 0.2126;
/** Luminance coefficient (green) */
const L_COEFF_G = 0.7152;
/** Luminance coefficient (blue) */
const L_COEFF_B = 0.0722;

/** Luminance of a given RGB */
function _luminance(r: number, g: number, b: number, gamma: number = 2.4): number {
	let _r = r * _z, _g = g * _z, _b = b * _z;
	let cr = _r > L_THRESHOLD ? Math.pow((_r + L_OFFSET) * L_SCALE_ADJ, gamma) : _r * L_SCALE_RAW;
	let cg = _g > L_THRESHOLD ? Math.pow((_g + L_OFFSET) * L_SCALE_ADJ, gamma) : _g * L_SCALE_RAW;
	let cb = _b > L_THRESHOLD ? Math.pow((_b + L_OFFSET) * L_SCALE_ADJ, gamma) : _b * L_SCALE_RAW;
	return L_COEFF_R*cr + L_COEFF_G*cg + L_COEFF_B*cb;
}

function _weight(x: number): number {
	if (x > 0.25) return Math.sqrt(x);
	else return x * (4+x*(16*x-12));
}

/** Channel blend functions */
let blend: BlendCalculations = {
	"normal": (a: number, b: number): number => (b),
	"bottom": (a: number, b: number): number => { return (b - b) || a; },
	"top": (a: number, b: number): number => { return (a - a) || b; },
	"darken": (a: number, b: number): number => (Math.min(a, b)),
	"lighten": (a: number, b: number): number => (Math.max(a, b)),
	"multiply": (a: number, b: number): number => {
		let _a = a * _z, _b = b * _z;
		return _a * _b * z;
	},
	"screen": (a: number, b: number): number => {
		let _a = a * _z, _b = b * _z;
		return (1 - (1-_a) * (1-_b)) * z;
	},
	"lineardodge": (a: number, b: number): number => { return Math.min(z, a+b); },
	"linearburn": (a: number, b: number): number => { return Math.min(z, a+b-z); },
	"hardlight": (a: number, b: number): number => {
		let _b = b * _z;
		if (_b > 0.5) return blend.screen(a, (2*_b-1)*z);
		else return blend.multiply(a, (2*_b)*z);
	},
	"softlight": (a: number, b: number): number => {
		let _a = a * _z, _b = b * _z;
		if (_b > 0.5) return (_a + (2*_b-1)) * (_weight(_a)-_a) * z;
		else return (_a - (1-2*_b) * _a * (1-_a)) * z;
	},
	"vividlight": (a: number, b: number): number => {
		let _a = a * _z, _b = b * _z;
		if (_b > 0.5) return (_a + 2*(_b-0.5))*z;
		else return Math.min(z, a+2*b-z);
	},
	"linearlight": (a: number, b: number): number => {
		let _a = a * _z, _b = b * _z;
		if (_b > 0.5) return (_a + 2*(_b-0.5)) * z;
		else return Math.min(z, a+2*b-z);
	},
	"pinlight": (a: number, b: number): number => {
		let _a = a * _z, _b = b * _z;
		if (_b > 0.5) return Math.max(_a, 2*(_b-0.5)) * z;
		else return Math.min(_a, 2*_b) * z;
	},
	"overlay": (a: number, b: number): number => { return blend.hardlight(b, a); },
	"difference": (a: number, b: number): number => { return Math.abs(b - a); },
	"exclusion": (a: number, b: number): number => {
		let _a = a * _z, _b = b * _z;
		return (_a + _b - 2*_a*_b) * z;
	},
	"colordodge": (a: number, b: number): number => {
		if (b < z) return Math.min(1, a/(z-b)) * z;
		else return b;
	},
	"colorburn": (a: number, b: number): number => {
		if (b > 0) return (1 - Math.min(1, (z-a)/b)) * z;
		else return b;
	},
	"hardmix": (a: number, b: number): number => {
		if (b > zh) return z < (a+b) ? z : 0;
		else return z > (a+b) ? 0 : z;
	},
};

/** Mix 8-bit channels weighted by normalized alphas */
function _mix_weighted(a: number, b: number, a1: number, a2: number): number {
	let _a = a * _z, _b = b * _z;
	return z * (_a*a1 + _b*a2*(1.0-a1)) / (a1+a2*(1.0-a1));
}

function _pad(s: string, l: number, p: string = ' '): string {
	let r = `${s}`;
	if (p?.length) while (r.length < l) r = `${p}${r}`;
	return r;
}

/** Namespace for color functions */
export class Color {
	/** A new instance of transparent black */
	public static get transparent(): RColor {
		return {
			"red": 0,
			"green": 0,
			"blue": 0,
			"alpha": 0
		};
	}
	/** Output CSS string */
	public static toCSS(c: RColor): string {
		return `rgba(${c.red|0}, ${c.green|0}, ${c.blue|0}, ${c.alpha * _z})`;
	}
	/** Output hex string */
	public static toHex(c: RColor, useAlpha: boolean = false): string {
		let r = _pad(c.red.toString(16), 2, '0');
		let g = _pad(c.green.toString(16), 2, '0');
		let b = _pad(c.blue.toString(16), 2, '0');
		let a = _pad(c.alpha.toString(16), 2, '0');
		return `#${useAlpha || c.alpha < 255 ? a : ''}${r}${g}${b}`;
	}
	/** Convert an HSL(A) color to an RGB(A) one */
	public static fromHSL(h: number, s: number, l: number, a: number = 255): RColor {
		return _hsl_to_rgb(h, s, l, a);
	}
	public static isEqual(c1: RColor, c2: RColor, ignoreAlpha: boolean = false): boolean {
		if (JSON.stringify(c1) === JSON.stringify(c2)) return true;
		else if (c1.red !== c2.red || c1.green !== c2.green || c1.blue !== c2.blue) return false;
		else if (c1.alpha !== c2.alpha) return ignoreAlpha;
		else return true;
	}
	public static blend(cBottom: RColor, cTop: RColor, mode: string): RColor {
		let ret: RColor = Color.transparent;
		let rgb = ["red", "green", "blue"];
		let rgba = [ ...rgb, "alpha" ];
		if ("function" === typeof blend[mode]) {
			for (let ch of rgba) {
				ret[ch] = blend[mode](cBottom[ch], cTop[ch]) | 0;
			}
		}
		else if (mode === "alpha") {
			let _a1 = cBottom.alpha * _z, _a2 = cTop.alpha * _z;
			for (let ch of rgb) {
				ret[ch] = _mix_weighted(cBottom[ch], cTop[ch], _a1, _a2) | 0;
			}
			ret["alpha"] = ((_a1 + _a2*(1.0-_a1)) * z) | 0;
		}
		return ret;
	}
}
