import { defineConfig } from 'vite';
// Vite Plugins
import { sveltekit } from '@sveltejs/kit/vite';

const enableSourceMap = process.env.SKIP_SOURCEMAPS !== 'true';

export default defineConfig({
	build: { sourcemap: enableSourceMap },
	plugins: [sveltekit()],
	server: {
		cors: {
			origin: true, // Mirrors 'Origin' header into the CORS response
			credentials: true // Sets 'Access-Control-Allow-Credentials' header
		},
		proxy: {
			'/api': {
				target: 'https://api.bbchallenge.org',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, '')
			}
		}
	}
});
