<script lang="ts">
  import Katex from "../lib/Katex.svelte"
let nbTM5 = "21^{10}"
</script>

<div class="dark">
<div class="prose prose-invert text-white  -mt-4  lg:ml-[200px] ml-0 sm:ml-2 font-sans prose-base sm:prose-lg ">
<div class="leading-normal">
<div>

## Table of contents

## Method

With the busy beaver challenge we want to decide the halting problem of all 5-state Turing machines (from all-0 tape), i.e. for any 5-state Turing machine we want to know whether it halts or not starting from all-0 tape. That way we will be able to learn BB(5), the 5<sup>th</sup> busy beaver value. See [Story](/story) for more information and motivation.

In order to achieve this goal we need to somehow analyse the behavior of every single 5-state Turing machine. We quickly run into a problem: there are roughly 167 trillion 5-state Turing machines (<Katex math={nbTM5}/> to be exact).

Thankfully most of this space is not _useful_ to us. That is for instance because permuting the states of a machine will only generate machines^[These machines are said to be *isomorphic*.] that have the exact same behavior so only one of them is worth studying. Hence, in practice, the _naïve_ <Katex math={nbTM5}/> bound can be reduced by several orders of magnitude.

The method that we present to enumerate the _useful_ space of 5-state Turing machines and analyse their behavior is fundamentally inspired by [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html) with some notable differences that we will outline. The first difference is that our method is divided into two successive phases:

1. **Phase 1:** enumerate the _useful_ space of 5-state Turing machines and mark as **undecided** any machine that exceeded the set time or space limits. This first phase enumerated 125,479,953 5-state Turing machines and marked **88,664,064** of them as undecided. This provided the [Seed Database](#seed-database) of undecided 5-state machines on which the busy beaver challenge is built. We can refer to undecided 5-state machines thanks to their [index]() in the seed database (e.g. Machine <a href="/7410754&s=10000&w=300&ox=0.5">#7,410,754</a>).

2. **Phase 2:** write independent [Deciders](#deciders), programs that will decide the behavior of families of machines in the seed database. We aim to classify these families in the [Zoology](/#zoology) and to come up with one decider per family. For instance, [this decider](https://github.com/bbchallenge/bbchallenge-deciders/tree/main/decider-translated-cyclers) decided the family of [Translated Cyclers]() (e.g. Machine <a href="/59090563&s=10000&w=300&ox=0.5">#59,090,563</a>).

<!-- ## Table of contents -->
<!-- ### Seed run

### Zoology

### Deciders -->

</div>
</div>
</div>
</div>
