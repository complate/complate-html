import { generateAttributes, isVoidElement } from "./html";
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

export function makeCreateElement(Element, DeferredElement) {
	return (tag, attributes, ...children) => {
		if(tag.call) { // macro
			return tag(attributes, ...children);
		}
		return new Element(tag, attributes, sanitizeChildren(children, DeferredElement));
	};
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
		let isVoid = this.void = isVoidElement(tag);
		if(isVoid && children && children.length) {
			throw new Error(`void elements must not have children: \`<${tag}>\``);
		}

		this.tag = tag;
		this.attribs = attributes || {};
		this.children = children || [];
	}

	get startTag() {
		// TODO: performance optimization by avoiding `generateAttributes`
		//       invocation if unnecessary
		return `<${this.tag}${generateAttributes(this.attribs)}>`;
	}

	get endTag() {
		return this.void ? "" : `</${this.tag}>`;
	}
}

// XXX: only fdor testing purposes
export let createElement = makeCreateElement(Element, DeferredElement);
