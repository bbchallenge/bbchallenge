<script lang="ts">
	import { numberWithCommas } from '$lib/utils';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	const zoology = [
		{ name: 'Cyclers', decided: true, nb_decided: 11229238, examples: [279081, 4231819, 279081] },
		{
			name: 'Translated cyclers',
			decided: true,
			nb_decided: 73860604,
			examples: [59645887, 15167997, 59090563]
		},
		{ name: 'Unilateral bouncers', decided: false, examples: [6048289, 4175994, 9281450] },
		{ name: 'Bilateral bouncers', decided: false, examples: [12785688, 8929416, 76727755] },
		{
			name: 'Translated unilateral bouncers',
			decided: false,
			examples: [6164147, 31837821, 20076854]
		},
		{ name: 'Exponential counters', decided: false, examples: [14244805, 10936909, 3840180] },
		{ name: 'Bells', decided: false, examples: [8527536, 73261028, 63938734] },
		{ decided: false, examples: [6490892, 11018350, 9390305] }
	];
</script>

<div id="zoology">
	<div class="text-xl">Zoology</div>
	<div class="ml-3 text-sm">
		This zoology is <a
			href="https://discuss.bbchallenge.org/t/current-zoology/23"
			class="text-blue-400 hover:text-blue-300 cursor-pointer">collaborative</a
		>.
	</div>
	<div class="ml-3">
		<div class="flex flex-col space-y-2 mt-2">
			{#each zoology as entry, i}
				<div>
					{#if entry['name'] !== undefined}
						{i + 1}. {entry['name']}
						{#if entry['decided']}
							<span class="text-green-400 font-bold">Decided</span>
							<span class="text-[0.6rem]">({numberWithCommas(entry['nb_decided'])} machines)</span>
						{:else}
							<span class="text-yellow-400 font-bold">WIP</span>
						{/if}
					{:else}
						<div class="text-xs">Not classified yet:</div>
					{/if}

					<div class="ml-8 text-xs">
						e.g:
						{#each entry['examples'] as m}
							<span
								class="cursor-pointer select-none underline"
								on:click={() => {
									dispatch('machine', { machine: m });
								}}
							>
								#{numberWithCommas(m)}</span
							>&nbsp;
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
<!-- 
      
      
      <div class="max-w-[450px] flex flex-col space-y-2">
      <div>
        <div class="text-xl">Highlighted machines</div>
        <div class="text-sm mt-1">Coming back soon</div>
       
        {#if highlighted != null && highlighted['highlighted_undecided'] != null}
          <div class="text-sm w-[400px] mt-1 ml-2">Scary undecided machines:</div>
          <div class="mt-1 ml-8 w-full flex flex-col  ">
            {#each highlighted['highlighted_undecided'] as m}
              {#if m['machine_id'] !== undefined}
                <div
                  class="cursor-pointer select-none"
                  on:click={async () => {
                    await loadMachineFromID(m['machine_id']);
                    updateSimulationParameters(m['link']);
                    draw();
                    window.history.replaceState({}, '', m['link']);
                  }}
                >
                  &middot;&nbsp;{#if m['title'] != undefined}{m['title']}{:else}Machine #<span
                      class="underline">{numberWithCommas(m['machine_id'])}</span
                    >{/if}
                </div>
              {:else if m['b64'] !== undefined}
                <div
                  class="cursor-pointer select-none"
                  on:click={async () => {
                    await loadMachineFromB64(m['b64']);
                    updateSimulationParameters(m['link']);
                    draw();
                    window.history.replaceState({}, '', m['link']);
                  }}
                >
                  &middot;&nbsp;{#if m['title'] != undefined}{m['title']}{:else}Machine <span
                      class="underline">{m['b64']}</span
                    >{/if}
                </div>
              {/if}
            {/each}
          </div>
        {/if}
      </div>
      <div class="">
        <div class="text-sm w-[400px] ml-2">BB champions and other halting machines:</div>
        <div class="w-full flex flex-col space-y-2 ml-8 mt-2">
          <div
            class="cursor-pointer select-none leading-tight"
            on:click={async () => {
              await loadMachineFromB64(
                'mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB',
                TMDecisionStatus.DECIDED_HALT
              );
              updateSimulationParameters(
                '/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt'
              );
              draw();
              window.history.replaceState(
                {},
                '',
                'mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt'
              );
            }}
          >
            &middot;&nbsp;BB(5): 47,176,870-halter

            <span class=" text-xs">
              <a href="http://turbotm.de/~heiner/BB/mabu90.html " target="_blank"
                >[Marxen & Buntrock, 1990]</a
              >
            </span>
          </div>
          <div
            class="cursor-pointer select-none leading-tight"
            on:click={async () => {
              await loadMachineFromB64(
                'mAQACAQEFAQADAQAGAQEEAAACAQAFAAEDAQEBAAAEAAAAAQAD',
                TMDecisionStatus.DECIDED_HALT
              );
              updateSimulationParameters(
                '/mAQACAQEFAQADAQAGAQEEAAACAQAFAAEDAQEBAAAEAAAAAQAD&s=20000&w=400&ox=0.08&status=halt'
              );
              draw();
              window.history.replaceState(
                {},
                '',
                'mAQACAQEFAQADAQAGAQEEAAACAQAFAAEDAQEBAAAEAAAAAQAD&s=20000&w=400&ox=0.08&status=halt'
              );
            }}
          >
            &middot;&nbsp;BB(6): <Katex math={ApproxBB6} />-halter

            <span class="text-xs">
              <a href="http://turbotm.de/~heiner/BB/bb-xlist.txt" target="_blank"
                >[Kropitz, 2010]</a
              >
            </span>
          </div>
          <div
            class="cursor-pointer select-none leading-tight"
            on:click={async () => {
              await loadMachineFromB64(
                'mAQEFAAAAAQADAQAGAQEEAAACAQAFAAEDAQEHAAAEAAAAAQADAQACAQEF',
                TMDecisionStatus.DECIDED_HALT
              );
              updateSimulationParameters(
                '/mAQEFAAAAAQADAQAGAQEEAAACAQAFAAEDAQEHAAAEAAAAAQADAQACAQEF&s=20000&w=400&ox=0.08&status=halt'
              );
              draw();
              window.history.replaceState(
                {},
                '',
                'mAQEFAAAAAQADAQAGAQEEAAACAQAFAAEDAQEHAAAEAAAAAQADAQACAQEF&s=20000&w=400&ox=0.08&status=halt'
              );
            }}
          >
            &middot;&nbsp;BB(7): <Katex math={ApproxBB72} />-halter

            <span class="text-xs">
              <a
                target="_blank"
                href="https://googology.fandom.com/wiki/User_blog:Wythagoras/A_good_bound_for_S(7)%3F"
                >[Wythagoras, 2014]</a
              >
            </span>
          </div>
        </div>
        <div class="w-full flex flex-col space-y-2 ml-8 mt-2">
          <div
            class="cursor-pointer select-none leading-tight"
            on:click={async () => {
              await loadMachineFromB64(
                'mAQACAAEEAQEDAQAEAQEBAQEDAAAAAQAFAQABAAAC',
                TMDecisionStatus.DECIDED_HALT
              );
              updateSimulationParameters(
                '/mAQACAAEEAQEDAQAEAQEBAQEDAAAAAQAFAQABAAAC&s=20000&ox=0.1&status=halt'
              );
              draw();
              window.history.replaceState(
                {},
                '',
                'mAQACAAEEAQEDAQAEAQEBAQEDAAAAAQAFAQABAAAC&s=20000&ox=0.1&status=halt'
              );
            }}
          >
            &middot;&nbsp;23,554,764-halter
            <span class="text-xs">
              <a href="http://bbchallenge.org" target="_blank">[bbchallenge, 2021]</a>
            </span>
          </div>
        </div>
        <div class="w-full flex flex-col space-y-2 ml-8 mt-2">
          <div
            class="cursor-pointer select-none leading-tight"
            on:click={async () => {
              await loadMachineFromB64(
                'mAQACAQEDAAEBAAEEAQEBAAAAAQECAQAFAAAEAAAC',
                TMDecisionStatus.DECIDED_HALT
              );
              updateSimulationParameters(
                '/mAQACAQEDAAEBAAEEAQEBAAAAAQECAQAFAAAEAAAC&s=20000&w=300&ox=0.98&status=halt'
              );
              draw();
              window.history.replaceState(
                {},
                '',
                'mAQACAQEDAAEBAAEEAQEBAAAAAQECAQAFAAAEAAAC&s=20000&w=300&ox=0.98&status=halt'
              );
            }}
          >
            &middot;&nbsp;2,133,492-halter

            <span class="text-xs">
              <a href="http://bbchallenge.org" target="_blank">[bbchallenge, 2021]</a>
            </span>
          </div>
        </div>
      </div>
      <div class="">
        <div class="text-sm w-[400px] ml-2 mt-1">
          Some <a href="/story#skelets-43-undecided-machines" rel="external" class="underline"
            >Skelet's machines</a
          >:
        </div>
        <div class="w-full flex flex-col space-y-2 ml-8 mt-2">
          <div>
            <span
              class="cursor-pointer select-none leading-tight"
              on:click={async () => {
                await loadMachineFromB64('mAQEDAQEFAAAAAQEEAQAEAAEEAQEBAQAFAAECAAAD');
                updateSimulationParameters(
                  '/mAQEDAQEFAAAAAQEEAQAEAAEEAQEBAQAFAAECAAAD&s=10000&ox=0.9'
                );
                draw();
                window.history.replaceState(
                  {},
                  '',
                  'mAQEDAQEFAAAAAQEEAQAEAAEEAQEBAQAFAAECAAAD&s=10000&ox=0.9'
                );
              }}
            >
              &middot;&nbsp;Skelet's machine 1
            </span>
            <span class="text-xs">
              ≈ Machine
              <span
                class="cursor-pointer select-none underline"
                on:click={async () => {
                  await loadMachineFromID(68329601);
                  updateSimulationParameters(`/${68329601}&s=10000&ox=0.1`);
                  draw();
                  window.history.replaceState({}, '', `/${68329601}&s=10000&ox=0.1`);
                }}
              >
                #{numberWithCommas(68329601)}</span
              >
            </span>
          </div>
          <div>
            <span
              class="cursor-pointer select-none leading-tight"
              on:click={async () => {
                await loadMachineFromB64('mAQEDAAAFAAAAAAADAQAEAAEBAQABAQAEAQEBAAAC');
                updateSimulationParameters(
                  '/mAQEDAAAFAAAAAAADAQAEAAEBAQABAQAEAQEBAAAC&s=20000&ox=0.1'
                );
                draw();
                window.history.replaceState(
                  {},
                  '',
                  'mAQEDAAAFAAAAAAADAQAEAAEBAQABAQAEAQEBAAAC&s=20000&ox=0.1'
                );
              }}
            >
              &middot;&nbsp;Skelet's machine 2
            </span>
            <span class="text-xs">
              ≈ Machine
              <span
                class="cursor-pointer select-none underline"
                on:click={async () => {
                  await loadMachineFromID(55767995);
                  updateSimulationParameters(`/${55767995}&s=20000&ox=0.9`);
                  draw();
                  window.history.replaceState({}, '', `/${55767995}&s=10000&ox=0.9`);
                }}
              >
                #{numberWithCommas(55767995)}</span
              >
            </span>
          </div>
          <div>
            <span
              class="cursor-pointer select-none leading-tight"
              on:click={async () => {
                await loadMachineFromB64('mAQEDAAABAAAAAQEFAQAEAAECAQABAQADAAEDAQEE');
                updateSimulationParameters(
                  '/mAQEDAAABAAAAAQEFAQAEAAECAQABAQADAAEDAQEE&s=20000&ox=0.5'
                );
                draw();
                window.history.replaceState(
                  {},
                  '',
                  'mAQEDAAABAAAAAQEFAQAEAAECAQABAQADAAEDAQEE&s=20000&ox=0.5'
                );
              }}
            >
              &middot;&nbsp;Skelet's machine 3
            </span>
            <span class="text-xs">
              ≈ Machine
              <span
                class="cursor-pointer select-none underline"
                on:click={async () => {
                  await loadMachineFromID(5950405);
                  updateSimulationParameters(`/${5950405}&s=20000&ox=0.5`);
                  draw();
                  window.history.replaceState({}, '', `/${5950405}&s=10000&ox=0.5`);
                }}
              >
                #{numberWithCommas(5950405)}</span
              >
            </span>
          </div>
        </div>
        <div class="w-full flex flex-col space-y-2 ml-8 mt-2">
          <a class="cursor-pointer select-none leading-tight" href="/skelet" rel="external">
            &middot;&nbsp;<span class="underline">full list</span>
          </a>
        </div>
      </div>
    </div>  -->
