export function generateAttributes(params) {
	let attribs = Object.keys(params).reduce((memo, name) => {
		let value = params[name];
		switch(value) {
		// blank attributes
		case null:
		case undefined:
			break;
		// boolean attributes (e.g. `<input … autofocus>`)
		case true:
			memo.push(name);
			break;
		case false:
			break;
		// regular attributes
		default:
			if(typeof value === "number") {
				value = value.toString();
			}
			memo.push(`${name}="${htmlEncode(value, true)}"`);
		}
		return memo;
	}, []);
	return attribs.length === 0 ? "" : ` ${attribs.join(" ")}`;
}

// adapted from TiddlyWiki <http://tiddlywiki.com> and Python 3's `html` module
function htmlEncode(str, attribute) {
	let res = str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;");
	return attribute ? res.replace(/"/g, "&quot;").replace(/'/g, "&#x27;") : res;
}
