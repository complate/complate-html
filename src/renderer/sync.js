import { childContents, startTag, endTag } from "./html";
import { Element, DeferredElement } from "../elements";

export let render = (element, stream) => {
	if(element instanceof Element) {
		return renderElement(element, stream);
	} else if(element instanceof DeferredElement) {
		throw new Error("deferred elements unsupported in synchronous rendering");
	} else {
		stream.write(childContents(element));
	}
};

let renderElement = (element, stream) => {
	stream.write(startTag(element));
	element.children.forEach(child => render(child, stream));
	stream.write(endTag(element));
};
