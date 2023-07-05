import type { ParamMatcher } from '@sveltejs/kit';

export const match = ((param) => {
    return !param.startsWith('~')
}) satisfies ParamMatcher;