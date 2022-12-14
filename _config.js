import lume from "lume/mod.ts";
import pug from "lume/plugins/pug.ts";
import sass from "lume/plugins/sass.ts";
import markdownFilter from "npm:jstransformer-markdown-it"

// Basics
const site = lume({
	src: "./src",
	dest: "./dist",
	location: new URL("https://www.pomorph.com"),
	server: {
		port: 1234,
		open: true
	}
});

// Plugins
site.use(pug());
site.use(sass({
	includes: "./src/sass"
}));

// Static copies
site.copy("./src/assets/favicons", ".")
site.copy("./src/assets/fonts", "fonts")
site.copy("./src/assets/img", "img")

// Load assets
site.loadAssets([".js"])

export default site;
