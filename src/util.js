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
