import * as elements from "./elements";
import { iterAsync, isBlank, repr } from "./util";
import { htmlEncode } from "./html";

export { defer } from "./elements";

export function HTMLString(str) {
	if(isBlank(str) || !str.substr) {
		throw new Error(`invalid ${repr(this.constructor.name, false)}: ${repr(str)}`);
	}
	this.value = str;
}

export class DeferredElement extends elements.DeferredElement {
	renderSync(stream) {
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
				stream.write(childContents(child));
				next();
			}
		}, () => {
			stream.write(this.endTag);
			callback();
		});
	}

	renderSync(stream) {
		stream.write(this.startTag);
		this.children.forEach(child => {
			if(child.renderSync) {
				child.renderSync(stream);
			} else {
				stream.write(childContents(child));
			}
		});
		stream.write(this.endTag);
	}
}

function childContents(child) {
	return child instanceof HTMLString ? // eslint-disable-next-line indent
					child.value : htmlEncode(child.toString());
}

export let createElement = elements.makeCreateElement(Element, DeferredElement);
