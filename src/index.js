import * as elements from "./elements";
import { isBlank, repr } from "./util";
import { htmlEncode } from "./html";
import DelayedStream from "./delayed_stream";

export function HTMLString(str) {
	if(isBlank(str) || !str.substr) {
		throw new Error(`invalid ${repr(this.constructor.name, false)}: ${repr(str)}`);
	}
	this.value = str;
}

export class DeferredElement extends elements.DeferredElement {
	renderSync(stream) {
		throw new Error("deferred elements unsupported in synchronous rendering");
	}

	renderAsync(stream) {
		return this.promise.then(element => {
			return element.renderAsync(stream);
		});
	}
}

export class Element extends elements.Element {
	renderAsync(stream) {
		stream.write(this.startTag);

		return Promise.all(this.children.map(child => {
			let ds = new DelayedStream();
			if(child.renderAsync) {
				return child.renderAsync(ds);
			} else {
				ds.write(childContents(child));
				return ds;
			}
		})).then(delayedStreams => {
			delayedStreams.map(ds => ds.apply(stream));
			stream.write(this.endTag);
			return stream;
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
