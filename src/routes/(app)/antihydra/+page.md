<SeoTitle value="Antihydra" />

<script lang="ts">
import { onMount } from 'svelte';
import SeoTitle from "$lib/seo_title.svelte";
import TmSimulator from "$lib/tm_simulator.svelte"
import { machineCodeToTM, tmToTuringMachineDotIO  } from '$lib/tm';
import {Antihydra} from '$lib/machine_repertoire'
import Katex from "$lib/Katex.svelte"

let theCode = tmToTuringMachineDotIO(machineCodeToTM(Antihydra))
let set01 = "{0,1}"

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

<div class="flex justify-center" style="font-size: 80%;">

The strange nature of this problem has earned it the name
</div>
<div class="flex justify-center" style="font-size: 200%;">
<a href="https://wiki.bbchallenge.org/wiki/Antihydra">Antihydra</a>
</div>
<div class="flex justify-center">
<a href="https://wiki.bbchallenge.org/wiki/File:Antihydra-depiction.png"><img
    src="/Antihydra-depiction.png"
    alt="A digital depiction of a hydra inspired by the antihydra cryptid Turing machine."
    class="h-[200px] m-0 p-0"
/></a>


</div>

What is the maximum number of steps a 2-symbol ({set01}), n-state Turing Machine can take, starting from an initially zeroed-out tape, before halting? The function that gives this value for a given number of states n - BB(n) - is called the [Busy Beaver](https://en.wikipedia.org/wiki/Busy_beaver) ([maximum shift](https://wiki.bbchallenge.org/wiki/Busy_Beaver_Functions)) function.

Obtaining each value requires proving the behavior of all programs with that number of states - whether they run indefinitely or halt - and if so, after how many steps.

The highest number of steps for 5-state machines was [recently proven to be 47,176,870](https://discuss.bbchallenge.org/t/july-2nd-2024-we-have-proved-bb-5-47-176-870/237), and with this all values of BB(n) up to BB(5) are [now known](https://www.quantamagazine.org/amateur-mathematicians-find-fifth-busy-beaver-turing-machine-20240702/). Now, work has begun to find the longest running (but halting) Turing Machine program with 6 states - the value of BB(6).

But researchers have already encountered a difficult problem: a 6-state machine that exhibits behavior of a kind no one has ever managed to prove to halt or not. Its behavior can be described very simply in the languages of mathematics:

<div class="flex justify-center m-0 -mt-10">
<img
    src="/antihydra_formula.png"
    alt="A short formulation of the Antihydra problem."
    class="m-0 p-0"
/>
</div>
and programming:

```python
def antihydra():
    a = 8
    b = 0
    while b != -1:
        if a % 2 == 0:
            b += 2
        else:
            b -= 1
        a += a//2
```

but even *attempts* at a proof have been elusive.

By [probabilistic argument](https://wiki.bbchallenge.org/wiki/Antihydra#Simulation) it seems [likely](https://wiki.bbchallenge.org/wiki/Probvious) that it will never halt. But nonetheless it might, and if so, might even be the longest running program and thus determine the value of BB(6). So it is necessary to understand its behavior in order to conclusively prove the value of BB(6). In a way it is the "first"/"shortest" problem that humanity doesn't yet know how to solve.

It's [Collatz-likeness](https://wiki.bbchallenge.org/wiki/Collatz-like) seems to indicate that...

<a href="https://www.sligocki.com/2024/07/06/bb-6-2-is-hard.html"><h3>BB(6) is hard</h3></a>

<div class="mb-20"></div>

</div>
</div>
</div>
</div>
