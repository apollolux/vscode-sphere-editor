export interface NConfig {
	[configKey: string]: boolean;
	// set: (cfgKey: T extends keyof this, cfgVal: )
}

const RE_DASH = /-([a-z])/g;
const RE_UPPER = /([A-Z])/g;

function camel(match: string, p1: string): string {
	return p1.toUpperCase();
}
function uncamel(match: string, p1: string): string {
	return '-' + p1.toLowerCase();
}

export function dashToCamel(s: string): string {
	return s.replace(RE_DASH, camel);
}
export function camelToDash(s: string): string {
	return s.replace(RE_UPPER, uncamel);
}