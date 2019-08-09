import { isBlank, repr } from "../util";

export let VOID_ELEMENTS = {}; // poor man's `Set`
[
	"area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
	"link", "meta", "param", "source", "track", "wbr"
].forEach(tag => {
	VOID_ELEMENTS[tag] = true;
});
export function isVoidElement(tag) {
	return VOID_ELEMENTS[tag];
}

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
export function htmlEncode(str, attribute) {
	let res = str.replace(/&/g, "&amp;").
		replace(/</g, "&lt;").
		replace(/>/g, "&gt;");
	return attribute ? res.replace(/"/g, "&quot;").replace(/'/g, "&#x27;") : res;
}

export function HTMLString(str) {
	if(isBlank(str) || !str.substr) {
		throw new Error(`invalid ${repr(this.constructor.name, false)}: ${repr(str)}`);
	}
	this.value = str;
}

export function childContents(child) {
	return child instanceof HTMLString ? // eslint-disable-next-line indent
					child.value : htmlEncode(child.toString());
}

export function startTag(element) {
	// TODO: performance optimization by avoiding `generateAttributes`
	//       invocation if unnecessary
	return element.tag ? `<${element.tag}${generateAttributes(element.attribs)}>` : "";
}

export function endTag(element) {
	return (element.tag && !isVoidElement(element.tag)) ? `</${element.tag}>` : "";
}
