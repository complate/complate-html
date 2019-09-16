export let BLANKS = [undefined, null, false];

export function isBlank(value) {
	return BLANKS.indexOf(value) !== -1;
}

export function repr(value, jsonify = true) {
	return `\`${jsonify ? JSON.stringify(value) : value}\``;
}
