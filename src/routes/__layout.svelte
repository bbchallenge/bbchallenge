<div class="p-3">
	<nav class="px-4 pb-3 mt-4  flex justify-between h-10 border-b-2">
		<!-- top bar left -->
		<ul class="flex items-end">
			<!-- add button -->
			<h1 class="text-xl"><a href="/">The Busy Beaver Challenge</a></h1>
		</ul>

		<!-- to bar right  -->
		<ul class="flex items-end">
			<li class="pr-8"><a href="/">Machine</a></li>
			<li class="pr-8"><a href="/story">The Story</a></li>
			<li class="pr-8"><a href="/zoology">Zoology</a></li>
			<li class="pr-8"><a href="/contribute">Contribute</a></li>
			<li class="pr-8"><a href="https://discuss.bbchallenge.org">Forum</a></li>
		</ul>
	</nav>

	<slot />
</div>

<style global windi:global windi:preflights:global windi:safelist:global>
	body {
		@apply bg-gray-900 text-white font-mono;
	}

	a {
		@apply cursor-pointer;
	}

	a:hover {
		@apply text-gray-200;
	}
</style>
