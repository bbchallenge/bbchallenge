<script lang="ts">
	import { page } from '$app/stores';
	function currentRoute() {
		if ($page.url.toString().includes('story')) {
			return 'story';
		}
		if ($page.url.toString().includes('zoology')) {
			return 'zoology';
		}
		if ($page.url.toString().includes('contribute')) {
			return 'contribute';
		}
		return 'root';
	}
</script>

<div class="p-3">
	<nav class="px-2 <md:px-0 pb-2 flex justify-between h-9 border-b-2 <sm:flex-col <sm:h-14 mt-1">
		<!-- top bar left -->
		<ul class="flex items-end pr-2 <md:pr-0">
			<!-- add button -->
			<h1 class="text-xl <md:text-base"><a href="/">The Busy Beaver Challenge</a></h1>
		</ul>

		<!-- to bar right  -->
		<ul class="flex items-end space-x-4 <md:space-x-2 <md:text-sm main-menu">
			<li>
				<a href="/" class="active" class:active={currentRoute() == 'root'}>Machines </a>
			</li>
			<li>
				<a href="/story" class="disabled" class:active={currentRoute() == 'story'}>Story</a>
			</li>
			<!-- <li>
				<a href="/zoology" class="disabled" class:active={currentRoute() == 'zoology'}>Zoology</a>
			</li> -->
			<li>
				<a href="/contribute" class:active={currentRoute() == 'contribute'}>Contribute </a>
			</li>
			<li><a href="https://discuss.bbchallenge.org">Forum</a></li>
		</ul>
	</nav>

	<slot />
</div>

<style windi:global windi:preflights:global windi:safelist:global>
	:global(body) {
		@apply bg-gray-900 text-white font-mono;
	}

	.main-menu a {
		@apply cursor-pointer;
		color: rgba(190, 199, 238);
	}

	.main-menu a.active {
		color: rgba(250, 251, 252);
	}

	.main-menu a.disabled {
		@apply cursor-default opacity-50;
	}

	.main-menu a:hover:not(.disabled) {
		@apply text-[#dee2f7];
	}

	:global(input) {
		@apply text-black px-1 py-0.5;
	}
</style>
