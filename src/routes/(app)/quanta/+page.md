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

## 5-state Green halter

<TmSimulator machineCode="1LD1LB_1LZ1LA_0LB1LD_0LE0LD_1RE1RC"/>

## Halts after 11 steps -- Justin Blanchard

[https://bbchallenge.org/1RB0LC_1LA0RC_1RA---](https://bbchallenge.org/1RB0LC_1LA0RC_1RA---)

<TmSimulator machineCode="1RB0LC_1LA0RC_1RA---"/>

## 3-state cycle -- @Iijil

[https://bbchallenge.org/1RB0LC_0LA---_0RA---](https://bbchallenge.org/1RB0LC_0LA---_0RA---)

<TmSimulator machineCode="1RB0LC_0LA---_0RA---"/>


<!-- ## Halters

### Halts after 4 steps -- cosmo

<TmSimulator machineCode="1RB1RB_1LA---_------_------_------"/>

### Halts after 16 steps -- savask

<TmSimulator machineCode="1RB0LC_0LB1LA_1RA0RD_1RD0RE_0LE---"/>

### Halts after 21 steps (3 states) -- mei

<TmSimulator machineCode="1RB---_1LB0RC_1LC1LA"/>

### Halts after 105 steps -- cosmo

<TmSimulator machineCode="1RB1LC_0LB1LA_1RD1LB_1RE0RD_0RA---"/>

### Halts after 47,176,870 steps -- Marxen & Buntrock

<TmSimulator/>

## Non-halters

### "Trivial" translated cycler (glider)

<TmSimulator machineCode="0RA---_------_------_------_------"/>

### Translated cycler (glider) -- Matthew House

<TmSimulator machineCode="1RB0LA_1LC0RA_0LD1LD_1LA1LE_0LB---"/>

### Cycler -- savask

<TmSimulator machineCode="1RB0LC_0LB1LA_1RA0RD_1RD0RE_0LA---"/>

### 3-state Bouncer -- Justin Blanchard

See the [space-time diagram](https://bbchallenge.org/story#space-time-diagrams) [here](https://bbchallenge.org/1RB0LC_1LB1RA_---1LA).

<TmSimulator machineCode="1RB0LC_1LB1RA_---1LA"/> -->




<div class="mb-20"></div>

</div>
</div>
</div>
</div>
