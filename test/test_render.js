/* global describe, it */
import { createElement, HTMLString, Fragment, renderSync, renderAsync } from "../src";
import BufferedStream from "../src/stream/buffered";
import assert, { strictEqual as assertSame } from "assert";
import { SiteIndex } from "./macros";

function renderAndAssert(element, string) {
	// Sync first
	let stream = new BufferedStream();
	renderSync(element, stream);
	assertSame(stream.read(), string);

	// Async
	stream = new BufferedStream();
	return renderAsync(element, stream).then(stream => assertSame(stream.read(), string));
}

describe("basic rendering", () => {
	it("should correspond to the function signature prescribed by JSX", () => {
		let root = createElement("body", null,
				createElement("p", { class: "foo" }, "lorem ipsum", "dolor sit amet"));

		return renderAndAssert(root, '<body><p class="foo">lorem ipsumdolor sit amet</p></body>');
	});

	it("should support nested elements", () => {
		let el = createElement("foo", null,
				createElement("bar", null,
						createElement("baz", null, "loremipsum")));

		return renderAndAssert(el, "<foo><bar><baz>loremipsum</baz></bar></foo>");
	});

	it("should support unknown elements", () => {
		let el = createElement("custom-element");

		return renderAndAssert(el, "<custom-element></custom-element>");
	});

	it("should omit closing tag for void elements", () => {
		let el = createElement("input");

		return renderAndAssert(el, "<input>");
	});

	it("should support both elements and strings/numbers as child elements", () => {
		let el = createElement("p", null,
				createElement("em", null, "hello"),
				"lorem ipsum",
				createElement("mark", null, "world"),
				123);

		return renderAndAssert(el, "<p><em>hello</em>lorem ipsum<mark>world</mark>123</p>");
	});

	it("should ignore blank values for child elements", () => {
		let el = createElement("p", null, null, "hello", undefined, "world", false);

		return renderAndAssert(el, "<p>helloworld</p>");
	});

	it("should support nested arrays for child elements", () => {
		let el = createElement("p", null, "foo", ["hello", ["…", "…"], "world"], "bar");

		return renderAndAssert(el, "<p>foohello……worldbar</p>");
	});

	it("should support generated child elements", () => {
		let el = createElement("div", null,
				"lorem ipsum",
				["foo", "bar", "baz"].map(item => {
					return createElement("i", null, item);
				}),
				"dolor sit amet");

		return renderAndAssert(el,
				"<div>lorem ipsum<i>foo</i><i>bar</i><i>baz</i>dolor sit amet</div>");
	});
});

describe("fragments", () => {
	it("should support virtual fragment elements", () => {
		let el = createElement(Fragment, null,
				createElement("span", null, "lorem"),
				createElement("span", null, "ipsum"));

		return renderAndAssert(el, "<span>lorem</span><span>ipsum</span>");
	});

	it("should support multiple root elements (via virtual fragment elements)", () => {
		let root = createElement(Fragment, null,
				createElement("li", null, "foo"),
				createElement("li", null, "bar"),
				createElement("li", null, "baz"));
		return renderAndAssert(root, "<li>foo</li><li>bar</li><li>baz</li>");
	});
});

describe("macros", () => {
	it("should perform markup expansion", () => {
		let macro = SiteIndex({ title: "hello world" });
		return renderAndAssert(macro, "<html>" +
									'<head><meta charset="utf-8"><title>hello world</title></head>' +
									"<body><h1>hello world</h1><p>…</p></body>" +
								"</html>");
	});
});

describe("HTML attributes", _ => {
	it("should convert parameters to suitable attributes", () => {
		let el = createElement("input", {
			type: "text",
			id: 123,
			name: null,
			title: undefined,
			autofocus: true,
			disabled: false
		});

		return renderAndAssert(el, '<input type="text" id="123" autofocus>');
	});
});

describe("HTML encoding", _ => {
	it("should encode attributes and contents", () => {
		let el = createElement("div", { title: 'foo& <i>"bar"</i> \'baz' },
				createElement("p", null, 'lorem& <em>"ipsum"</em> \'…'));

		return renderAndAssert(el, "<div " +
				'title="foo&amp; &lt;i&gt;&quot;bar&quot;&lt;/i&gt; &#x27;baz">' +
				'<p>lorem&amp; &lt;em&gt;"ipsum"&lt;/em&gt; \'…</p></div>');
	});

	it("should allow for raw HTML, circumventing content encoding", () => {
		assert.throws(_ => new HTMLString(), /invalid/);
		assert.throws(_ => new HTMLString(null), /invalid/);
		assert.throws(_ => new HTMLString(false), /invalid/);
		assert.throws(_ => new HTMLString({}), /invalid/);
		assertSame((new HTMLString("")).value, "");

		let el = createElement("p", null, new HTMLString("foo <i>bar</i> baz"));

		let stream = new BufferedStream();
		renderSync(el, stream);
		let html = stream.read();
		assert(html.includes("<p>foo <i>bar</i> baz</p>"));
	});
});
