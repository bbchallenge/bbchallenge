<script lang="ts">
import TmSimulator from "../lib/tm_simulator.svelte"
import { onMount } from 'svelte';

onMount(() => { // TODO: this shouldn't be necessary
    const id = window.location.hash.replace(/^#/, '');
    const element = id && document.getElementById(id);
    console.log(id,element)
    if (id && element) {
      element.scrollIntoView();
    }
  });

</script>

<div class="dark">
<div class="prose prose-invert text-white  -mt-4  lg:ml-[200px] ml-0 sm:ml-2 font-sans prose-base sm:prose-lg ">
<div class="leading-normal">

<!-- ## Table of contents -->

<a id="goal"></a>

## Goal

The goal of the busy beaver challenge is to prove or disprove the following conjecture [[Aaronson, 2020]](https://www.scottaaronson.com/papers/bb.pdf):

<div class="flex justify-center">
<div class="math math-display">
BB(5) = 47,176,870
</div>
</div>

This conjecture says that 47,176,870 is the maximum number of steps that a 5-state [Turing machine](#turing-machines) can run before halting (starting from blank memory tape).

The conjecture is based on earlier work [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html) which discovered the current <a  href="https://bbchallenge.org/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt" rel="external">5-state busy beaver champion</a>, a machine that halts after 47,176,870 steps:

<div class="flex flex-col items-center">
<div class="w-1/3 -mt-5 font-mono">

|     | 0   | 1   |
| --- | --- | --- |
| A   | 1RB | 1LC |
| B   | 1RC | 1RB |
| C   | 1RD | 0LE |
| D   | 1LA | 1LD |
| E   | ??? | 0LA |

</div>
</div>

Achieving the goal of the busy beaver challenge implies to study **88,664,064 Turing machines** and decide whether they halt or not, see [Methodology](#methodology).

[You can help!](/contribute)

<a id="context"></a>

## Context

<a id="turing-machines"></a>

### Turing machines

The introduction of Turing machines by Alan Turing in 1936 is arguably one of the founding events of computer science, [[Turing, 1936]](https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf).

Turing machines can be thought as a primitive computer architecture providing (i) a runtime environment consisting of a moving read/write head over a memory tape divided in adjacent memory cells and (ii) a programming language allowing us to control the behavior of the head depending on the content of the memory cell where it is currently at.

The Turing machines we work with have one bi-infinite memory tape where each cell is either containing a 0 or a 1.

The programmer specifies the code of the machine in a table with 2 columns and <span class="math math-inline">q</span> rows. Rows are called **states**. Here is the code of the current <a  href="https://bbchallenge.org/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt">5-state busy beaver champion</a>:

<div class="flex flex-col items-center -mb-2">
<div class="w-1/3 -mt-5 font-mono">

|     | 0                                                             | 1   |
| --- | ------------------------------------------------------------- | --- |
| A   | <span class="bg-purple-400 font-bold text-black">1RB</span>   | 1LC |
| B   | 1RC                                                           | 1RB |
| C   | 1RD                                                           | 0LE |
| D   | 1LA                                                           | 1LD |
| E   | <span class="bg-green-400 text-gray-900 font-bold">???</span> | 0LA |

</div>
</div>

Each entry of the table is called a **transition** and instructs us what to do when reading a 0 or a 1 in a given state. For instance, in the above machine, <span class="bg-purple-400 font-bold text-black">&nbsp;reading a 0 in state A&nbsp;</span> will:

1. write a 1 at the current head position (i.e replacing the read 0 with a 1)
2. move the head to the right
3. jump to state B for the next instruction

The machine will **halt** (i.e. cease functionning) if it ever meets an **undefined transitions** denoted by **???**. Here, it would happen only if ever <span class="bg-green-400 text-gray-900 font-bold">&nbsp;reading a 0 in state E&nbsp;</span>.

In the context of the busy beaver challenge, machines are always executed starting in state A and with a memory tape that is initially blank (i.e. all memory cells are 0).

#### Interactive simulator

As with probably any programming language, the best way to understand Turing machines is to play with them:

<TmSimulator/>

<a id="space-time-diagrams"></a>

#### Space-time diagrams

Space-time diagrams provide a condensed way to visualise the behavior of a machine. The space-time diagram of a machine is a 2D image where the i<sup>th</sup> row represents the memory tape of the machine at the i<sup>th</sup> iteration. Black pixels are used for memory cells containing 0 and white for 1.

Here is the space-time diagram of the first 10,000 iterations of the <a  href="https://bbchallenge.org/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt" rel="external">5-state busy beaver champion</a>:

<div class="flex justify-center -mt-16 -mb-8">

![](./bb5.png)

</div>

Colors green and red track the head position and movement: green when the head goes to the left and red when it goes to the right.

#### Machine base-64 representation

In order to condense Turing machines programs in copyable strings we encode them in <a href="https://github.com/bbchallenge/website-frontend/blob/main/src/lib/tm.ts#L5">base-64</a>. For instance, the base-64 encoding of the <a  href="https://bbchallenge.org/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt" rel="external">5-state busy beaver champion</a> is: <span class="text-sm select-all">mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB</span>.

Any machine can be visualised given its base-64 encoding, for instance: <a  href="https://bbchallenge.org/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB" rel="external" class="text-sm">https://bbchallenge.org/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB</a>.

<!-- #### Runtime

Turing machines have to physically move their head to a memory cell before they can read or write the data located there. This contrasts with the Random Access Memory (RAM) architecture used by modern computers where any _random_ memory cell can be accessed instantly given its address. Nonetheless, any algorithm that can be implemented using a modern RAM computer can be implemented with a Turing machine (and vice versa). -->

### Will it halt or not?

### The busy beaver function

<a id="methodology"></a>

## Methodology

### Seed run

### Zoology

### Deciders

### Possible outcomes

</div>
</div>
</div>
