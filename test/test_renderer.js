/* global describe, it */
import { SiteIndex, BlockingContainer, NonBlockingContainer } from "./macros";
import { Fragment, createElement, AsyncRenderer, SyncRenderer } from "../src";
import BufferedStream from "../src/stream/buffered";
import { BufferedLogger } from "./util";
import assert from "assert";

let assertSame = assert.strictEqual;

describe("renderer", _ => {
	it("should support custom doctypes", done => {
		let { renderView, stream } = setup({ doctype: "<!DOCTYPE … XHTML …>" });

		renderView(HTMLRoot, null, stream, { fragment: false }).then(_ => {
			assertSame(stream.read(), "<!DOCTYPE … XHTML …>\n<html></html>");
			done();
		});
	});

	it("should omit doctype for HTML fragments", done => {
		let { renderView, stream } = setup();

		renderView(HTMLRoot, null, stream, { fragment: true }).then(_ => {
			assertSame(stream.read(), "<html></html>");
			done();
		});
	});

	it("should support multiple root elements (via virtual fragment elements)", done => {
		let { renderView, stream } = setup();

		let view = () => {
			return createElement(Fragment, null,
					createElement("li", null, "foo"),
					createElement("li", null, "bar"),
					createElement("li", null, "baz"));
		};
		renderView(view, null, stream, { fragment: true }).then(_ => {
			assertSame(stream.read(), "<li>foo</li><li>bar</li><li>baz</li>");
			done();
		});
	});

	it("should support blank views", done => {
		let { renderView, stream } = setup();

		let BlankView = () => "";

		renderView(BlankView, null, stream, { fragment: true }).then(_ => {
			assertSame(stream.read(), "");
			done();
		});
	});

	it("should support blocking mode", done => {
		let { renderView, stream } = setup({ sync: true });

		renderView(BlockingContainer, null, stream, { fragment: true });
		assertSame(stream.read(),
				"<div><p>…</p><p><i>lorem<em>…</em>ipsum</i></p><p>…</p></div>");
		done();
	});

	it("should support non-blocking mode", done => {
		let { renderView, stream } = setup();

		renderView(NonBlockingContainer, null, stream, { fragment: true }).then(_ => {
			assertSame(stream.read(),
					"<div><p>…</p><p><i>lorem ipsum</i></p><p>…</p></div>");
			done();
		});
	});

	it("should detect non-blocking child elements in blocking mode", done => {
		let { renderView, stream } = setup({ sync: true });

		let fn = _ => renderView(NonBlockingContainer, null, stream);
		assert.throws(fn, /deferred elements unsupported in synchronous rendering/);
		done();
	});

	it("should perform markup expansion for macros", done => {
		let { renderView, stream } = setup();

		/* eslint-disable indent */
		renderView(SiteIndex, { title: "hello world" }, stream,
				{ fragment: true }).then(_ => {
			assertSame(stream.read(), "<html>" +
					'<head><meta charset="utf-8"><title>hello world</title></head>' +
					"<body><h1>hello world</h1><p>…</p></body>" +
					"</html>");
			done();
		});
		/* eslint-enable indent */
	});

	it("should resolve registered macros", done => {
		let { registerView, renderView, stream } = setup();

		registerView(SiteIndex);
		/* eslint-disable indent */
		renderView("SiteIndex", { title: "hello world" }, stream,
				{ fragment: true }).then(_ => {
			assertSame(stream.read(), "<html>" +
					'<head><meta charset="utf-8"><title>hello world</title></head>' +
					"<body><h1>hello world</h1><p>…</p></body>" +
					"</html>");
			done();
		});
		/* eslint-enable indent */
	});

	it("should balk at unregistered macros", done => {
		let { renderView, stream } = setup();

		let fn = _ => renderView("foo", null, stream);
		assert.throws(fn, /unknown view macro/);
		done();
	});

	it("should support custom logging", done => {
		let logger = new BufferedLogger();
		let { renderView, stream } = setup({ log: logger.log });

		renderView(SiteIndex, {}, stream, {}).then(_ => {
			// let messages = logger.all;
			// TODO : Do some simple assertions

			done();
		});
	});
});

function HTMLRoot() {
	return createElement("html");
}

function setup(options = {}) {
	let sync = !!options.sync;
	let { registerView, renderView } = sync ? new SyncRenderer(options) : new AsyncRenderer(options);
	return {
		registerView,
		renderView,
		stream: new BufferedStream()
	};
}
