import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

import { mdsvex } from 'mdsvex';

import remarkToc from 'remark-toc';
import remarkFootnotes from 'remark-footnotes';
import remarkMath from 'rehype-mathjax';
import rehypeKatex from 'rehype-katex'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess(),
		mdsvex({
			extensions: ['.md'],
			rehypePlugins: [rehypeKatex],
			remarkPlugins: [
				[remarkToc, { tight: true, ordered: true, maxDepth: 3 }],
				[remarkFootnotes, { inlineNotes: true }],
				remarkMath,

			]
		})
	],

	extensions: ['.svelte', '.md'],

	kit: {
		adapter: adapter({
			// default options are shown
			pages: 'build',
			assets: 'build',
			fallback: '200.html'
		})
	}
};

export default config;
