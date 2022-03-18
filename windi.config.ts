import { defineConfig } from 'windicss/helpers';
import typography from 'windicss/plugin/typography';

export default defineConfig({
	theme: {},
	darkMode: 'class',
	variants: {},
	plugins: [
		typography({
			dark: true,
		})
	]
});
