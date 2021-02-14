import { RColor, RColorRGBA, RColorCMYKA, RColorHSLA, RColorHSVA } from "./rpg.internal";

/** Interface for color blend functions */
export interface BlendFunction<T extends RColor> {
	(cBottom: T, cTop: T): T;
}


interface BlendCalculation {
	(cBottom: number, cTop: number): number;
}

interface BlendCalculations {
	[name: string]: BlendCalculation;
}

/** Bits per channel */
const CH_BITS = 8;
/** Channel max value, assumes 8-bit */
const z = (1 << CH_BITS) - 1;
const zh = (z) >> 1;
/** Channel scale */
const _z = 1.0/z;

// /** YIQ coefficients (Y) */
// const Y_COEFF_Y = [0.299, 0.587, 0.114];
// /** YIQ coefficients (I) */
// const Y_COEFF_I = [0.596, 0.274, 0.322];
// /** YIQ coefficients (Q) */
// const Y_COEFF_Q = [0.211, 0.523, 0.312];

// /** Convert given RGB to YIQ */
// function _rgb_to_yiq(r: number, g: number, b: number, a: number = 255): any {
// 	let ret: any = {};
// 	ret["y"] = (Y_COEFF_Y[0] * r + Y_COEFF_Y[1] * g + Y_COEFF_Y[2] * b) * _z;
// 	ret["i"] = (Y_COEFF_I[0] * r - Y_COEFF_I[1] * g - Y_COEFF_I[2] * b) * _z;
// 	ret["q"] = (Y_COEFF_Q[0] * r - Y_COEFF_Q[1] * g + Y_COEFF_Q[2] * b) * _z;
// 	ret["a"] = a;
// 	return ret;
// }

/** Convert given RGB to CMYK */
function _rgb_to_cmyk(r: number, g: number, b: number, a: number = 255): RColorCMYKA {
	let ret: RColorCMYKA;
	let _r = r * _z, _g = g * _z, _b = b * _z;
	let _k = Math.max(_r, _g, _b);
	let k = (1 - _k);
	let key = 100 / _k;
	ret = {
		"cyan": (_k - _r) * key,
		"magenta": (_k - _g) * key,
		"yellow": (_k - _b) * key,
		"black": k * 100,
		"alpha": a
	};
	return ret;
}

/** Convert given CMYK to RGB */
function _cmyk_to_rgb(c: number, m: number, y: number, k: number, a: number = 255): RColorRGBA {
	let ret: RColorRGBA = {
		"red": z * (1 - c * 0.01) * (1 - k * 0.01),
		"green": z * (1 - m * 0.01) * (1 - k * 0.01),
		"blue": z * (1 - y * 0.01) * (1 - k * 0.01),
		"alpha": a
	};
	return ret;
}

/** Convert given RGB to HSL */
function _rgb_to_hsl(r: number, g: number, b: number, a: number = 255): RColorHSLA {
	let ret: RColorHSLA;
	let _min = Math.min(r, g, b), _max = Math.max(r, g, b);
	let _delta = _max - _min;
	let ch = 0, cs = 0, cl = 0;
	cl = _z * 0.5 * (_max+_min);
	if (!_delta) {
		ch = 0;
		cs = 0;
	}
	else {
		let _r = r * _z, _g = g * _z, _b = b * _z;
		let _dr: number, _dg: number, _db: number;
		let _mn = _min * _z, _mx = _max * _z, _d = _delta * _z;
		if (cl < 0.5) cs = _d/(_mx+_mn);
		else cs = _d/(2-_mx-_mn);
		_dr = (((_mx-_r)/6)+0.5*_d)/_d;
		_dg = (((_mx-_g)/6)+0.5*_d)/_d;
		_db = (((_mx-_b)/6)+0.5*_d)/_d;
		if (r === _max) ch = (0) + _db - _dg;
		else if (g === _max) ch = (1/3.0) + _dr - _db;
		else if (b === _max) ch = (2/3.0) + _dg - _dr;
		if (ch < 0) ch += 1.0;
		if (ch > 1) ch -= 1.0;
	}
	ret = {
		"hue": ch,
		"saturation": cs,
		"lightness": cl,
		"alpha": a
	};
	return ret;
}

/** Convert given RGB to HSV */
function _rgb_to_hsv(r: number, g: number, b: number, a: number = 255): RColorHSVA {
	let ret: RColorHSVA;
	let _min = Math.min(r, g, b), _max = Math.max(r, g, b);
	let _delta = _max - _min;
	let ch = 0, cs = 0, cv = 0;
	let _mx = _max * _z, _d = _delta * _z;
	cv = _mx;
	if (_delta) {
		let _r = r * _z, _g = g * _z, _b = b * _z;
		let _dr: number, _dg: number, _db: number;
		if (_max) cs = _d/_mx;
		_dr = (((_mx-_r)/6)+0.5*_d)/_d;
		_dg = (((_mx-_g)/6)+0.5*_d)/_d;
		_db = (((_mx-_b)/6)+0.5*_d)/_d;
		if (r === _max) ch = (0) + _db - _dg;
		else if (g === _max) ch = (1/3.0) + _dr - _db;
		else if (b === _max) ch = (2/3.0) + _dg - _dr;
		if (ch < 0) ch += 1.0;
		if (ch > 1) ch -= 1.0;
	}
	ret = {
		"hue": ch,
		"saturation": cs,
		"value": cv,
		"alpha": a
	};
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
function _hsl_to_rgb(h: number, s: number, l: number, a: number = 255): RColorRGBA {
	let ret: RColorRGBA;
	let cr = 0, cg = 0, cb = 0;
	if (!s) {
		cr = l * z;
		cg = l * z;
		cb = l * z;
	}
	else {
		let _2 = l < 0.5 ? l*(1+s) : (l+s) - s*l;
		let _1 = 2 * l - _2;
		cr = z * _from_hue(_1, _2, h+(1/3));
		cg = z * _from_hue(_1, _2, h+(0));
		cb = z * _from_hue(_1, _2, h-(1/3));
	}
	ret = {
		"red": cr,
		"green": cg,
		"blue": cb,
		"alpha": a
	};
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

const CH_RGB = ["red", "green", "blue"];
const CH_RGBA = [ ...CH_RGB, "alpha" ];
const CH_CMYK = ["cyan", "magenta", "yellow", "black"];
const CH_CMYKA = [ ...CH_CMYK, "alpha" ];

/** Namespace for color functions */
export class Color {
	/** A new instance of transparent zero color */
	public static transparent<T extends RColor>(): T {
		let ret: T = ({ "alpha": 0 }) as T;
		let wh = Color.what(ret);
		if (wh === "rgb") {
			ret = { "red": 0, "green": 0, "blue": 0, ...ret };
		}
		else if (wh === "cmyk") {
			ret = { "cyan": 0, "magenta": 0, "yellow": 0, "black": 0, ...ret };
		}
		else if (wh === "hsl") {
			ret = { "hue": 0, "saturation": 0, "lightness": 0, ...ret };
		}
		return ret;
	}
	/** What space is a given color */
	public static what<T extends RColor>(c: T): string {
		if (Color.isRGB(c)) return "rgb";
		else if (Color.isCMYK(c)) return "cmyk";
		else if (Color.isHSL(c)) return "hsl";
		else return "color";
	}
	/** Is given color RGB? */
	public static isRGB<T extends RColor>(c: T | RColorRGBA): c is RColorRGBA {
		return ("red" in c) && ("green" in c) && ("blue" in c);
	}
	/** Is given color CMYK? */
	public static isCMYK<T extends RColor>(c: T | RColorCMYKA): c is RColorCMYKA {
		return ("cyan" in c) && ("magenta" in c) && ("yellow" in c) && ("black" in c);
	}
	/** Is given color HSL? */
	public static isHSL<T extends RColor>(c: T | RColorHSLA): c is RColorHSLA {
		return ("hue" in c) && ("saturation" in c) && ("lightness" in c);
	}
	/** Calculate gamma-adjusted luminance */
	public static luminance<T extends RColorRGBA>(c: T, gamma: number = 2.4): number {
		return _luminance(c.red, c.green, c.blue, gamma);
	}
	/** Output RGBA color */
	public static toRGB<T extends RColorCMYKA>(c: T): RColorRGBA {
		return _cmyk_to_rgb(c.cyan, c.magenta, c.yellow, c.black, c.alpha);
	}
	/** Output CMYKA color */
	public static toCMYK<T extends RColorRGBA>(c: T): RColorCMYKA {
		return _rgb_to_cmyk(c.red, c.green, c.blue, c.alpha);
	}
	/** Output HSLA color */
	public static toHSL<T extends RColorRGBA>(c: T): RColorHSLA {
		return _rgb_to_hsl(c.red, c.green, c.blue, c.alpha);
	}
	/** Output HSVA color */
	public static toHSV<T extends RColorRGBA>(c: T): RColorHSVA {
		return _rgb_to_hsv(c.red, c.green, c.blue, c.alpha);
	}
	/** Output CSS string */
	public static toCSS<T extends RColor>(c: T): string {
		if (Color.isRGB(c)) {
			return `rgba(${c.red|0}, ${c.green|0}, ${c.blue|0}, ${c.alpha * _z})`;
		}
		else if (Color.isCMYK(c)) {
			let _c = Color.toRGB(c);
			return `rgba(${_c.red|0}, ${_c.green|0}, ${_c.blue|0}, ${_c.alpha * _z})`;
		}
		else if (Color.isHSL(c)) {
			return `hsla(${c.hue}, ${c.saturation}, ${c.lightness}, ${c.alpha})`;
		}
		else {
			return `rgba(0, 0, 0, 0)`;
		}
	}
	/** Output RGB(A) hex string */
	public static toHex<T extends RColor>(c: T, onlyColor: boolean = true): string {
		let r: string, g: string, b: string, a: string;
		a = _pad(c.alpha.toString(16), 2, '0');
		if (Color.isRGB(c)) {
			r = _pad(c.red.toString(16), 2, '0');
			g = _pad(c.green.toString(16), 2, '0');
			b = _pad(c.blue.toString(16), 2, '0');
		}
		else if (Color.isCMYK(c)) {
			let _c = Color.toRGB(c);
			r = _pad(_c.red.toString(16), 2, '0');
			g = _pad(_c.green.toString(16), 2, '0');
			b = _pad(_c.blue.toString(16), 2, '0');
		}
		else if (Color.isHSL(c)) {
			let _c = Color.fromHSL(c.hue, c.saturation, c.lightness, c.alpha);
			r = _pad(_c.red.toString(16), 2, '0');
			g = _pad(_c.green.toString(16), 2, '0');
			b = _pad(_c.blue.toString(16), 2, '0');
		}
		else {
			// TODO
			r = '00';
			g = '00';
			b = '00';
		}
		return `#${!onlyColor && c.alpha < 255 ? a : ''}${r}${g}${b}`;
	}
	/** Convert a CMYK(A) color to an RGB(A) one */
	public static fromCMYK(c: number, m: number, y: number, k: number, a: number = 255): RColorRGBA {
		return _cmyk_to_rgb(c, m, y, k, a);
	}
	/** Convert an HSL(A) color to an RGB(A) one */
	public static fromHSL(h: number, s: number, l: number, a: number = 255): RColorRGBA {
		return _hsl_to_rgb(h, s, l, a);
	}
	// /** Convert an HSV(A) color to an RGB(A) one */
	// public static fromHSV(h: number, s: number, v: number, a: number = 255): RColorRGBA {
	// 	return _hsv_to_rgb(h, s, v, a);
	// }
	/** Do two colors of the same type have the same values? */
	public static isEqual<T extends RColor, U extends RColor>(c1: T | U, c2: U | T, ignoreAlpha: boolean = false): boolean {
		if (JSON.stringify(c1) === JSON.stringify(c2)) return true;
		if (Color.isRGB(c1) && Color.isRGB(c2)) return Color.isEqualRGB(c1, c2, ignoreAlpha);
		if (Color.isCMYK(c1) && Color.isCMYK(c2)) return Color.isEqualCMYK(c1, c2, ignoreAlpha);
		if (Color.isHSL(c1) && Color.isHSL(c2)) return Color.isEqualHSL(c1, c2, ignoreAlpha);
		// let w1 = Color.what(c1), w2 = Color.what(c2);
		// let a = c1.alpha === c2.alpha || ignoreAlpha;
		// if (w1 !== w2) return false;
		// else if (w1 === "rgb") {
		// 	if (c1.red !== c2.red || c1.green !== c2.green || c1.blue !== c2.blue) return false;
		// 	else return a;
		// }
		// else if (w1 === "cmyk") {
		// 	if (c1.cyan !== c2.cyan || c1.magenta !== c2.magenta || c1.yellow !== c2.yellow || c1.black !== c2.black) return false;
		// 	else return a;
		// }
		// else if (w1 === "hsl") {
		// 	if (c1.hue !== c2.hue || c1.saturation !== c2.saturation || c1.lightness !== c2.lightness) return false;
		// 	else return a;
		// }
		// else return ignoreAlpha;
		return Color.matches(c1, c2, 1, ignoreAlpha);
	}
	/** Are two colors similar within a given threshold? */
	private static matches<T extends RColor, U extends RColor>(
		c1: T,
		c2: U,
		threshold: number,
		ignoreAlpha: boolean = false
	): boolean {
		let a = c1.alpha === c2.alpha || ignoreAlpha;
		if (Color.isRGB(c1)) {
			// TODO: compare as RGB
		}
		else if (Color.isCMYK(c1)) {
			// TODO: compare as CMYK
		}
		else if (Color.isHSL(c1)) {
			// TODO: compare as HSL
		}
		return a;
		// TODO
	}
	public static isApproximatelyEqual<T extends RColor, U extends RColor>(
		c1: T,
		c2: U,
		ignoreAlpha: boolean = false
	): boolean {
		let w1 = Color.what(c1), w2 = Color.what(c2);
		if (w1 === w2) return Color.isEqual(c1, c2 as unknown as T, ignoreAlpha);
		if (Color.isRGB(c1)) {
			// TODO: compare as RGB
		}
		else if (Color.isCMYK(c1)) {
			// TODO: compare as CMYK
		}
		else if (Color.isHSL(c1)) {
			// TODO: compare as HSL
		}
		return false;
		// TODO
	}
	public static blend<T extends RColorRGBA>(cBottom: T, cTop: T, mode: string): T {
		let ret: T = Color.transparent();
		let c: RColorRGBA = Color.transparent();
		if ("function" === typeof blend[mode]) {
			for (let ch of CH_RGBA) {
				c[ch] = blend[mode](cBottom[ch], cTop[ch]) | 0;
			}
		}
		else if (mode === "alpha") {
			let _a1 = cBottom.alpha * _z, _a2 = cTop.alpha * _z;
			for (let ch of CH_RGB) {
				c[ch] = _mix_weighted(cBottom[ch], cTop[ch], _a1, _a2) | 0;
			}
			c["alpha"] = ((_a1 + _a2*(1.0-_a1)) * z) | 0;
		}
		// ret["red"] = c.red;
		// ret["green"] = c.green;
		// ret["blue"] = c.blue;
		// ret["alpha"] = c.alpha;
		ret = { ...ret, ...c };
		return ret;
	}

	private static isEqualRGB<T extends RColorRGBA>(c1: T, c2: T, ignoreAlpha: boolean = false): boolean {
		let a = c1.alpha === c2.alpha || ignoreAlpha;
		if (c1.red !== c2.red || c1.green !== c2.green || c1.blue !== c2.blue) return false;
		else return a;
	}
	private static isEqualCMYK<T extends RColorCMYKA>(c1: T, c2: T, ignoreAlpha: boolean = false): boolean {
		let a = c1.alpha === c2.alpha || ignoreAlpha;
		if (c1.cyan !== c2.cyan || c1.magenta !== c2.magenta || c1.yellow !== c2.yellow || c1.black !== c2.black) return false;
		else return a;
	}
	private static isEqualHSL<T extends RColorHSLA>(c1: T, c2: T, ignoreAlpha: boolean = false): boolean {
		let a = c1.alpha === c2.alpha || ignoreAlpha;
		if (c1.hue !== c2.hue || c1.saturation !== c2.saturation || c1.lightness !== c2.lightness) return false;
		else return a;
	}
}
