<SeoTitle value="Story" />

<script lang="ts">
import { onMount } from 'svelte';
import SeoTitle from "$lib/seo_title.svelte";
import TmSimulator from "$lib/tm_simulator.svelte"
import { machineCodeToTM, tmToTuringMachineDotIO  } from '$lib/tm';
import {BB5_champion} from '$lib/machine_repertoire'
import Katex from "$lib/Katex.svelte"



onMount(() => { // TODO: this shouldn't be necessary
    const id = window.location.hash.replace(/^#/, '');
    const element = id && document.getElementById(id);
    console.log(id,element)
    if (id && element) {
      window.scrollTo({ top: element.top, behavior: 'smooth' });
    }
  });

</script>

<div class="dark w-full ">
<div class="prose prose-invert text-white -mt-4  xl:justify-start lg:ml-[170px] ml-0 sm:ml-4 font-sans prose-base sm:prose-lg w-full">
<div class="leading-normal ">
<div>

## Halters

### Halts after 4 steps

<TmSimulator machineCode="1RB1RB_1LA---_------_------_------"/>

### Halts after 16 steps

<TmSimulator machineCode="1RB0LC_0LB1LA_1RA0RD_1RD0RE_0LE---"/>

### Halts after 21 steps (3 states)

<TmSimulator machineCode="1RB---_1LB0RC_1LC1LA"/>

### Halts after 105 steps

<TmSimulator machineCode="1RB1LC_0LB1LA_1RD1LB_1RE0RD_0RA---"/>

### Halts after 47,176,870 steps

<TmSimulator/>

## Non-halters

### "Trivial" translated cycler (glider)

<TmSimulator machineCode="0RA---_------_------_------_------"/>

### Cycler

<TmSimulator machineCode="1RB0LC_0LB1LA_1RA0RD_1RD0RE_0LA---"/>

### 3-state Bouncer

<TmSimulator machineCode="1RB0LC_1LB1RA_---1LA"/>




<div class="mb-20"></div>

</div>
</div>
</div>
</div>
