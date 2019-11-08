export let BLANKS = [undefined, null, false];

export function isBlank(value) {
	return BLANKS.indexOf(value) !== -1;
}

export function repr(value, jsonify = true) {
	return `\`${jsonify ? JSON.stringify(value) : value}\``;
}

export function iterAsync(items, startIndex, iterationCallback, finalCallback) { // TODO: rename
	for(let i = startIndex; i < items.length; i++) {
		let item = items[i];
		if(item.then) { // indicates async item
			iterationCallback(item,
					() => iterAsync(items, i + 1, iterationCallback, finalCallback));
			return;
		}

		iterationCallback(item, noop);
	}
	finalCallback();
}

function noop() {}
