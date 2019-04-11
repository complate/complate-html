import * as elements from "./elements";
import { iterAsync } from "./util";

export { defer } from "./elements";

export class DeferredElement extends elements.DeferredElement {
	renderSync() {
		throw new Error("deferred elements unsupported in synchrous rendering");
	}

	renderAsync(stream, callback) {
		this.promise.then(element => {
			element.renderAsync(stream, callback);
		});
	}
}

export class Element extends elements.Element {
	renderAsync(stream, callback) {
		stream.write(this.startTag);

		iterAsync(this.children, 0, (child, next) => {
			if(child.renderAsync) {
				child.renderAsync(stream, next);
			} else {
				stream.write(child);
				next();
			}
		}, () => {
			stream.write(this.endTag);
			callback();
		});
	}

	// FIXME: use stream interface for flushing purposes
	renderSync() {
		let html = this.startTag;
		this.children.forEach(child => {
			if(child.renderSync) {
				html += child.renderSync();
			} else {
				html += child;
			}
		});
		return `${html}${this.endTag}`;
	}
}

export let createElement = elements.makeCreateElement(Element, DeferredElement);
