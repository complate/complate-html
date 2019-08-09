import { isBlank } from "./util";

function sanitizeChildren(children, DeferredElement) {
	return children.reduce((memo, item) => {
		if(isBlank(item)) {
			return memo;
		}
		if(item.then) {
			item = new DeferredElement(item);
		}
		return memo.concat(item.pop ? sanitizeChildren(item, DeferredElement) : item);
	}, []);
}

export class DeferredElement {
	constructor(fn) {
		this.promise = new Promise(resolve => {
			return fn(resolve);
		});
	}
}

export class Element {
	constructor(tag, attributes, children) {
		this.tag = tag;
		this.attribs = attributes || {};
		this.children = children || [];
	}
}

export class FragmentElement extends Element {
	constructor(children) {
		super(null, null, children);
	}
}

export let Fragment = {};

export let createElement = (tag, attributes, ...children) => {
	if(tag.call) { // macro
		return tag(attributes, ...children);
	} else if(tag === Fragment) {
		return new FragmentElement(sanitizeChildren(children, DeferredElement));
	} else {
		return new Element(tag, attributes, sanitizeChildren(children, DeferredElement));
	}
};
