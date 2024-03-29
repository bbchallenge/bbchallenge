import type { PageLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const prerender = true;

export const load = (() => {
    throw redirect(308, '/~pascal.michel/index.html');
}) satisfies PageLoad;