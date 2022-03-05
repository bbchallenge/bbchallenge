<div class="p-3">
	<nav class="px-2 <md:px-0 pb-2 flex justify-between h-9 border-b-2 <sm:flex-col <sm:h-14 mt-1">
		<!-- top bar left -->
		<ul class="flex items-end pr-2 <md:pr-0">
			<!-- add button -->
			<h1 class="text-xl <md:text-base"><a href="/">The Busy Beaver Challenge</a></h1>
		</ul>

		<!-- to bar right  -->
		<ul class="flex items-end space-x-4 <md:space-x-2 <md:text-sm">
			<li><a href="/">Machines</a></li>
			<li><a href="/story" class="disabled">Story</a></li>
			<li><a href="/zoology" class="disabled">Zoology</a></li>
			<li><a href="/contribute" class="disabled">Contribute</a></li>
			<li><a href="https://discuss.bbchallenge.org" class="disabled">Forum</a></li>
		</ul>
	</nav>

	<slot />
</div>

<style windi:global windi:preflights:global windi:safelist:global>
	:global(body) {
		@apply bg-gray-900 text-white font-mono;
	}

	:global(a) {
		@apply cursor-pointer;
	}

	:global(a.disabled) {
		@apply cursor-default opacity-50;
	}

	:global(a):hover:not(.disabled) {
		@apply text-gray-200;
	}
</style>
