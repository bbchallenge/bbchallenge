import type { PageLoad } from './$types'
import { redirect } from '@sveltejs/kit'

export const prerender = true;

export const load = (() => {
    throw redirect(308, 'https://wiki.bbchallenge.org/wiki/Antihydra');
}) satisfies PageLoad;
