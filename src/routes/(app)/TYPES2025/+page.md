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

## Links shared in the BB5 talk at TYPES 2025

Here find all the links shared in the BB5 talk at [TYPES 2025](https://msp-strath.github.io/MSPweb/types2025/programme.html):

- First, [the slides](https://docs.google.com/presentation/d/1koofTIAOdk-DsKH6bnLi_jPeHG3-9vz2EcS_N5PsU-0/edit?usp=sharing)
- [bbchallenge.org](https://bbchallenge.org)
- [Coq-BB5](https://github.com/ccz181078/Coq-BB5)
- [Antihydra](https://bbchallenge.org/antihydra) and [Antihydra wiki page](https://wiki.bbchallenge.org/wiki/Antihydra)
- [Talk](https://www.youtube.com/watch?v=5X6YVEnbLZU&) and [slides](https://sakamoto.pl/~mei/bbslides/bbslides.html
) given at Formalisation of Mathematics Seminar @ Cambridge with Maja Kądziołka (slides by Maja)
- Quanta magazine BB5 [article](https://www.quantamagazine.org/amateur-mathematicians-find-fifth-busy-beaver-turing-machine-20240702) and [video](https://www.youtube.com/watch?v=rmx3FBPzDuk)
- Paper:
    - [PDF](https://github.com/bbchallenge/bbchallenge-paper/blob/build-paper-pdf/bbchallenge-paper.pdf)
    - [GitHub Repo](https://github.com/bbchallenge/bbchallenge-paper)
    - [Feedback Hub](https://github.com/bbchallenge/bbchallenge-paper/issues/9)

<div class="mb-20"></div>

</div>
</div>
</div>
</div>
