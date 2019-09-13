/* global describe, it */
import { createElement } from "../src/elements";
import assert, { strictEqual as assertSame, deepStrictEqual as assertDeep } from "assert";

describe("createElement", () => {
	it("should generate an AST-like object hierarchy", () => {
		let root = createElement("body", { class: "plain" });

		assertSame(root.tag, "body");
		assertSame(root.attribs.class, "plain");
		assertDeep(Object.keys(root.attribs), ["class"]);

		root = createElement("body", null,
				createElement("p", null, "lorem", "ipsum"));

		assertSame(root.tag, "body");
		assertDeep(Object.keys(root.attribs), []);
		assertSame(root.children.length, 1);
		let child = root.children[0];
		assertSame(child.tag, "p");
		assertDeep(Object.keys(root.attribs), []);
		assertDeep(child.children, ["lorem", "ipsum"]);
	});

	it("should support macros", () => {
		function Document({ className }, ...children) {
			return createElement("body", { class: className });
		}

		let root = createElement(Document, { className: "foo" });
		assertSame(root.tag, "body");
		assertDeep(Object.keys(root.attribs), ["class"]);
		assertSame(root.attribs.class, "foo");

		root = createElement(Document, { className: "bar" });
		assertSame(root.attribs.class, "bar");
	});

	it("should support deferred elements", done => {
		let root = createElement("body", { class: "plain" }, new Promise(resolve => {
			setTimeout(() => {
				let el = createElement("p", null, "lorem", "ipsum");
				resolve(el);
			}, 10);
		}));

		assert(root.children[0].then, "Child should be a Promise");
		root.children[0].
			then(element => {
				assertSame(element.tag, "p");
				assertDeep(Object.keys(element.attribs), []);
				done();
			});
	});
});
