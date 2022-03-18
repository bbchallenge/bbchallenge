import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';
import { windi } from 'svelte-windicss-preprocess';

import { mdsvex } from 'mdsvex'

import remarkToc from 'remark-toc'
import rehypeMathjax from 'rehype-mathjax'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [preprocess(), windi({}), mdsvex({
		extensions: ['.md'],
		rehypePlugins: [rehypeMathjax],
		remarkPlugins: [[remarkToc, { tight: true, ordered: true, maxDepth: 3 }]]

	})],

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
