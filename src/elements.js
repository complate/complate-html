import { generateAttributes } from "./html";

let VOID_ELEMENTS = {}; // poor man's `Set`
[
	"area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
	"link", "meta", "param", "source", "track", "wbr"
].forEach(tag => {
	VOID_ELEMENTS[tag] = true;
});

export function makeCreateElement(Element, DeferredElement) {
	return (tag, attributes, ...children) => {
		if(tag.call) { // macro
			return tag(attributes, ...children);
		}

		// convert promises to deferred elements
		children = children.map(child => {
			return child.then ? new DeferredElement(child) : child;
		});
		return new Element(tag, attributes, children);
	};
}

// generates a pseudo-promise for compatibility across JavaScript runtimes
export function defer(fn) {
	return {
		then: callback => fn(callback)
	};
}

export class DeferredElement {
	constructor(promise) {
		this.promise = promise;
	}

	then(callback, errback) {
		return this.promise.
			then(callback, errback);
	}

	catch(errback) {
		return this.promise.
			catch(errback);
	}
}

export class Element {
	constructor(tag, attributes, children) {
		let isVoid = this.void = VOID_ELEMENTS[tag];
		if(isVoid && (children || children.length)) {
			throw new Error(`void elements must not have children: \`<${tag}>\``);
		}

		this.tag = tag;
		this.attribs = attributes || {};
		this.children = children || [];
	}

	get startTag() {
		// TODO: performance optimization by avoiding `generateAttributes`
		//       invocation if unnecessary
		let suffix = this.void ? "/>" : ">";
		return `<${this.tag}${generateAttributes(this.attribs)}${suffix}`;
	}

	get endTag() {
		return this.void ? "" : `</${this.tag}>`;
	}
}

// XXX: only fdor testing purposes
export let createElement = makeCreateElement(Element, DeferredElement);
