import { redirect } from '@sveltejs/kit';

export function load({ url }) {
	// Redirect from old URLs with ampersand-delimited parameters
	const pathname = url.pathname;
	const ampIndex = pathname.indexOf('&');
	if (ampIndex !== -1) {
		const newPathname = pathname.slice(0, ampIndex);
		let search = pathname.slice(ampIndex + 1);
		if (url.search !== '')
			search += '&' + url.search.slice(1);
		let newUrl = new URL(newPathname, url);
		newUrl.search = search;
		throw redirect(301, newUrl);
	}
}
