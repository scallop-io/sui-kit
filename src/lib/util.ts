import { fromB64 } from '@mysten/sui.js'
/**
 * @description This regular expression matches any string that contains only hexadecimal digits (0-9, A-F, a-f).
 * @param str
 */
export const isHex = (str: string) => /^[0-9A-Fa-f]+$/g.test(str);

/**
 * @description This regular expression matches any string that contains only base64 digits (0-9, A-Z, a-z, +, /, =).
 * Note that the "=" signs at the end are optional padding characters that may be present in some base64 encoded strings.
 * @param str
 */
export const isBase64 = (str: string) => /^[a-zA-Z0-9+/]+={0,2}$/g.test(str);

/**
 * Convert a hex string to Uint8Array
 * @param hexStr
 */
export function fromHEX(hexStr: string): Uint8Array {
	if (!hexStr) {
		throw new Error('cannot parse empty string to Uint8Array')
	}
	let intArr = hexStr
		.replace('0x', '')
		.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16));

	if (!intArr || intArr.length === 0) {
		throw new Error(`Unable to parse HEX: ${hexStr}`);
	}
	return Uint8Array.from(intArr);
}


/**
 * @description Convert a hex or base64 string to Uint8Array
 */
export const hexOrBase64ToUint8Array = (str: string): Uint8Array => {
	if (isHex(str)) {
		return fromHEX(str)
	} else if (isBase64(str)) {
		return fromB64(str)
	} else {
		throw new Error('The string is not a valid hex or base64 string.');
	}
}
