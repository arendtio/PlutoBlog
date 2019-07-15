import riot from "rollup-plugin-riot"
import resolve from 'rollup-plugin-node-resolve'
import legacy from 'rollup-plugin-legacy';
import commonjs from 'rollup-plugin-commonjs'
import uglify from 'rollup-plugin-uglify'
import globImport from 'rollup-plugin-glob-import'
import visualizer from 'rollup-plugin-visualizer'

export default {
	input: "material/js/main.js",
	output: {
		file: "04_blog/js/bundle.min.js",
		name: "plutoblog",
		format: "umd"
	},
	external: [
		"process",
		"DISQUS",
		"DISQUS_SITE",
	],
	plugins: [
		globImport(),
		riot({ext: "tag.html"}),
		legacy({
			"material/js/highlight.pack.js": "hljs",
		}),
		resolve({"browser": true}),
		commonjs(),
		uglify(), // does not work with format: "es"
		visualizer({
			filename: "./stats.html",
		}),
	],
};
