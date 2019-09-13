import { createElement } from "../src";

export function SiteIndex({ title }) {
	return createElement(DefaultLayout, { title },
			createElement("h1", null, title),
			createElement("p", null, "…"));
}

export function BlockingContainer() {
	return createElement(FragmentLayout, null,
			createElement("p", null, "…"),
			createElement("p", null,
					createElement("i", null,
							"lorem",
							createElement("em", null, "…"),
							"ipsum")
			),
			createElement("p", null, "…"));
}

export function NonBlockingContainer() {
	return createElement(FragmentLayout, null,
			createElement("p", null, "…"),
			createElement("p", null, new Promise(resolve => {
				setTimeout(_ => {
					let el = createElement("i", null, "lorem ipsum");
					resolve(el);
				}, 10);
			})),
			createElement("p", null, "…"));
}

function DefaultLayout({ title }, ...children) {
	return createElement("html", null,
			createElement("head", null,
					createElement("meta", { charset: "utf-8" }),
					createElement("title", null, title)),
			createElement("body", null, ...children));
}

function FragmentLayout(_, ...children) {
	return createElement("div", null, ...children);
}
