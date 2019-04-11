/* global describe, it */
import { createElement, defer } from "../src";
import BufferedStream from "../src/buffered_stream";
import assert, { strictEqual as assertSame } from "assert";

describe("asynchronous rendering", () => {
	it("should generate HTML", done => {
		let root = createElement("body", null,
				createElement("p", { class: "info" }, "lorem", "ipsum"));
		let stream = new BufferedStream();
		root.renderAsync(stream, () => {
			let html = stream.read();
			assertSame(html, '<body><p class="info">loremipsum</p></body>');
			done();
		});
	});

	it("should support deferred child elements", done => {
		let root = createElement("body", null, defer(callback => {
			setTimeout(() => {
				let el = createElement("p", { class: "info" }, "lorem", "ipsum");
				callback(el);
			}, 10);
		}));
		let stream = new BufferedStream();
		root.renderAsync(stream, () => {
			let html = stream.read();
			assertSame(html, '<body><p class="info">loremipsum</p></body>');
			done();
		});
	});

	it("should support large numbers of deferred child elements", function(done) {
		this.timeout(3000);

		let deferred = range(10000).map((_, i) => {
			i++;
			if(i % 5000 !== 0) {
				return createElement("li", null, i);
			}

			return defer(callback => {
				let el = createElement("li", null, i);
				callback(el);
			});
		});
		let root = createElement("ul", null, ...deferred);

		let stream = new BufferedStream();
		root.renderAsync(stream, () => {
			let html = stream.read();
			assert(html.includes("<li>10000</li></ul>"));
			done();
		});
	});
});

describe("synchronous rendering", () => {
	it("should generate HTML", () => {
		let root = createElement("body", null,
				createElement("p", { class: "info" }, "lorem", "ipsum"));
		let html = root.renderSync();
		assertSame(html, '<body><p class="info">loremipsum</p></body>');
	});
});

function range(size) {
	return Array.apply(null, Array(size));
}
