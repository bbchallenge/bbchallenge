import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

import { mdsvex } from 'mdsvex';
// Markdown processing plugins
import remarkToc from 'remark-toc';
import remarkFootnotes from 'remark-footnotes';
import remarkMath from 'rehype-mathjax';
import rehypeKatex from 'rehype-katex';

const enableSourceMap = process.env.WITH_SOURCEMAPS === 'true';

/** @type {Parameters<typeof import('mdsvex').mdsvex>[0]} */
const mdsvexConfig = {
	extensions: ['.md'],
	rehypePlugins: [rehypeKatex],
	remarkPlugins: [
		[remarkToc, { tight: true, ordered: true, maxDepth: 3 }],
		[remarkFootnotes, { inlineNotes: true }],
		remarkMath
	]
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [mdsvex(mdsvexConfig), preprocess({ sourceMap: enableSourceMap })],

	extensions: ['.svelte', ...mdsvexConfig.extensions],

	kit: { adapter: adapter({ fallback: '200.html' }) },
	version: {
		name: process.env.VITE_APP_VERSION || Date.now().toString(),
		// Poll every 10 minutes for a new version
		pollInterval: 10 * 60_000
	}
};

export default config;
