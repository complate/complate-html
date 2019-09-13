import { childContents, startTag, endTag } from "./html";
import { Element, DeferredElement } from "../elements";
import BaseRenderer from "./";
import DelayedStream from "../stream/delayed";

export default class Renderer extends BaseRenderer {
	render(element, stream) {
		if(element instanceof Element) {
			return renderElement(element, stream);
		} else if(element instanceof DeferredElement) {
			return renderDeferredElement(element, stream);
		} else if(element.then) {
			return element.then(res => render(res, stream));
		} else {
			stream.write(childContents(element));
			return Promise.resolve(stream);
		}
	}
}

export let render = Renderer.prototype.render;

let renderElement = (element, stream) => {
	stream.write(startTag(element));

	return Promise.all(element.children.map(child => {
		let ds = new DelayedStream();
		return render(child, ds);
	})).then(delayedStreams => {
		delayedStreams.map(ds => ds.apply(stream));
		stream.write(endTag(element));
		return stream;
	});
};

let renderDeferredElement = (element, stream) => {
	return element.promise.then(element => {
		return render(element, stream);
	});
};
