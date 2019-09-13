/* global describe, it */
import { createElement, DeferredElement, renderSync, renderAsync } from "../src";
import BufferedStream from "../src/stream/buffered";
import assert, { strictEqual as assertSame } from "assert";
import { NonBlockingContainer } from "./macros";

describe("synchronous rendering", () => {
	it("should detect non-blocking child elements", done => {
		let stream = new BufferedStream();
		let fn = _ => renderSync(NonBlockingContainer(), stream);
		assert.throws(fn, /deferred elements unsupported in synchronous rendering/);
		done();
	});
});

describe("asynchronous rendering", () => {
	it("should support deferred child elements", () => {
		let root = createElement("body", null, new DeferredElement(callback => {
			setTimeout(() => {
				let el = createElement("p", { class: "info" }, "lorem", "ipsum");
				callback(el);
			}, 10);
		}));
		return renderAsync(root, new BufferedStream()).then(stream => {
			let html = stream.read();
			assertSame(html, '<body><p class="info">loremipsum</p></body>');
		});
	});

	it("should keep order if deferred child elements", () => {
		let root = createElement("body", null,
				new DeferredElement(callback => {
					setTimeout(() => {
						callback(createElement("a1"));
					}, 10);
				}),
				createElement("a2", null,
						new DeferredElement(callback => {
							setTimeout(() => {
								callback(createElement("a3"));
							}, 10);
						})),
				createElement("a4")
		);
		return renderAsync(root, new BufferedStream()).then(stream => {
			let html = stream.read();
			assertSame(html, "<body><a1></a1><a2><a3></a3></a2><a4></a4></body>");
		});
	});

	it("should support large numbers of deferred child elements in parallel", () => {
		let deferred = range(10000).map((_, i) => {
			i++;
			return new DeferredElement(callback => {
				setTimeout(() => {
					let el = createElement("li", null, i);
					callback(el);
				}, 100); // 100ms would lead to timeout if not executed parallely
			});
		});
		let root = createElement("ul", null, ...deferred);

		return renderAsync(root, new BufferedStream()).then(stream => {
			let html = stream.read();
			let expectedLis = range(10000).map((_, i) => `<li>${i}</li>`).join("");
			assert(html, `<ul>${expectedLis}</ul>`);
		});
	});

	it("might support Promises", () => {
		let root = createElement("div", {}, new Promise(resolve => {
			setTimeout(() => resolve(createElement("span", {}, "test")), 100);
		}));

		return renderAsync(root, new BufferedStream()).then(stream => {
			let html = stream.read();
			assert(html, "<div><span>test</span></div>");
		});
	});
});

function range(size) {
	return Array.apply(null, Array(size));
}
