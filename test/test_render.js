/* global describe, it */
import { createElement, HTMLString, Fragment, DeferredElement } from "../src";
import BufferedStream from "../src/buffered_stream";
import assert, { strictEqual as assertSame } from "assert";
import { SiteIndex, NonBlockingContainer } from "./macros";

describe("basic rendering", () => {
	it("should correspond to the function signature prescribed by JSX", () => {
		let root = createElement("body", null,
				createElement("p", { class: "foo" }, "lorem ipsum", "dolor sit amet"));
		let stream = new BufferedStream();
		root.renderSync(stream);
		let html = stream.read();
		assertSame(html, '<body><p class="foo">lorem ipsumdolor sit amet</p></body>');
	});

	it("should support nested elements", () => {
		let el = createElement("foo", null,
				createElement("bar", null,
						createElement("baz", null, "loremipsum")));

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<foo><bar><baz>loremipsum</baz></bar></foo>");
	});

	it("should support unknown elements", () => {
		let el = createElement("custom-element");

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<custom-element></custom-element>");
	});

	it.skip("should support virtual fragment elements", () => {
		let el = createElement(Fragment, null,
				createElement("span", null, "lorem"),
				createElement("span", null, "ipsum"));

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<span>lorem</span><span>ipsum</span>");
	});

	it("should omit closing tag for void elements", () => {
		let el = createElement("input");

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<input>");
	});

	it("should support both elements and strings/numbers as child elements", () => {
		let el = createElement("p", null,
				createElement("em", null, "hello"),
				"lorem ipsum",
				createElement("mark", null, "world"),
				123);

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<p><em>hello</em>lorem ipsum<mark>world</mark>123</p>");
	});

	it("should ignore blank values for child elements", () => {
		let el = createElement("p", null, null, "hello", undefined, "world", false);

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<p>helloworld</p>");
	});

	it("should support nested arrays for child elements", () => {
		let el = createElement("p", null, "foo", ["hello", ["…", "…"], "world"], "bar");

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<p>foohello……worldbar</p>");
	});

	it("should support generated child elements", () => {
		let el = createElement("div", null,
				"lorem ipsum",
				["foo", "bar", "baz"].map(item => {
					return createElement("i", null, item);
				}),
				"dolor sit amet");

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html,
				"<div>lorem ipsum<i>foo</i><i>bar</i><i>baz</i>dolor sit amet</div>");
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

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, '<input type="text" id="123" autofocus>');
	});
});

describe("HTML encoding", _ => {
	it("should encode attributes and contents", () => {
		let el = createElement("div", { title: 'foo& <i>"bar"</i> \'baz' },
				createElement("p", null, 'lorem& <em>"ipsum"</em> \'…'));

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assertSame(html, "<div " +
				'title="foo&amp; &lt;i&gt;&quot;bar&quot;&lt;/i&gt; &#x27;baz">' +
				'<p>lorem&amp; &lt;em&gt;"ipsum"&lt;/em&gt; \'…</p></div>');
	});

	it("should allow for raw HTML, cicrumventing content encoding", () => {
		assert.throws(_ => new HTMLString(), /invalid/);
		assert.throws(_ => new HTMLString(null), /invalid/);
		assert.throws(_ => new HTMLString(false), /invalid/);
		assert.throws(_ => new HTMLString({}), /invalid/);
		assertSame((new HTMLString("")).value, "");

		let el = createElement("p", null, new HTMLString("foo <i>bar</i> baz"));

		let stream = new BufferedStream();
		el.renderSync(stream);
		let html = stream.read();
		assert(html.includes("<p>foo <i>bar</i> baz</p>"));
	});
});

describe("synchronous rendering", () => {
	it("should detect non-blocking child elements", done => {
		let stream = new BufferedStream();
		let fn = _ => NonBlockingContainer().renderSync(stream);
		assert.throws(fn, /deferred elements unsupported in synchrous rendering/);
		done();
	});
});

describe("asynchronous rendering", () => {
	it("should generate HTML", () => {
		let root = createElement("body", null,
				createElement("p", { class: "info" }, "lorem", "ipsum"));
		return root.renderAsync(new BufferedStream()).then(stream => {
			let html = stream.read();
			assertSame(html, '<body><p class="info">loremipsum</p></body>');
		});
	});

	it("should support deferred child elements", () => {
		let root = createElement("body", null, new DeferredElement(callback => {
			setTimeout(() => {
				let el = createElement("p", { class: "info" }, "lorem", "ipsum");
				callback(el);
			}, 10);
		}));
		return root.renderAsync(new BufferedStream()).then(stream => {
			let html = stream.read();
			assertSame(html, '<body><p class="info">loremipsum</p></body>');
		});
	});

	it("should keof order if deferred child elements", () => {
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
		return root.renderAsync(new BufferedStream()).then(stream => {
			let html = stream.read();
			assertSame(html, "<body><a1></a1><a2><a3></a3></a2><a4></a4></body>");
		});
	});

	it("should support large numbers of deferred child elements in paralell", () => {
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

		return root.renderAsync(new BufferedStream()).then(stream => {
			let html = stream.read();
			let expectedLis = range(10000).map((_, i) => `<li>${i}</li>`).join("");
			assert(html, `<ul>${expectedLis}</ul>`);
		});
	});

	it.skip("should support multiple root elements (via virtual fragment elements)", () => {
		let root = createElement(Fragment, null,
				createElement("li", null, "foo"),
				createElement("li", null, "bar"),
				createElement("li", null, "baz"));
		return root.renderAsync(new BufferedStream()).then(stream => {
			let html = stream.read();
			assertSame(html, "<li>foo</li><li>bar</li><li>baz</li>");
		});
	});

	it("should perform markup expansion for macros", () => {
		return SiteIndex({ title: "hello world" }).
			renderAsync(new BufferedStream()).
			then(stream => {
				let html = stream.read();
				assertSame(html, "<html>" +
									'<head><meta charset="utf-8"><title>hello world</title></head>' +
									"<body><h1>hello world</h1><p>…</p></body>" +
								"</html>");
			});
	});
});

function range(size) {
	return Array.apply(null, Array(size));
}
