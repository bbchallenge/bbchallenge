<SeoTitle value="Method" />

<script lang="ts">
  import { onMount } from 'svelte';
  import SeoTitle from "$lib/seo_title.svelte";
  import Katex from "$lib/Katex.svelte"
  import {BB5_champion} from '$lib/machine_repertoire'
  let nbTM5 = "21^{10}"// Cannot inline {10} because of svelte

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

## Table of contents

## Overview

<a id="overview"></a>

With the Busy Beaver Challenge we want to decide the halting problem of all 5-state Turing machines (from all-0 tape). That way we will learn BB(5), the 5<sup>th</sup> busy beaver value. See <a href="/story" rel="external">Story</a>.

In order to achieve this goal we need to analyse the behavior of every single 5-state Turing machine. We quickly run into a problem: there are roughly 16 trillion 5-state Turing machines (<Katex math={nbTM5}/> to be exact).

Thankfully most of this space is not _useful_ to us and only a fraction needs to be studied in order to find BB(5). This is for instance because there are <Katex math="4! = 24"/> ways to permute the states (aside from the start state) of a machine and 2 ways to permute the move directions which does not change behavior hence only one of these 48 machines needs to be studied.

Hence, we aim at _sparsely_ enumerating the space of 5-state Turing machines: that is trying to enumerate the least amount of machines that are necessary to study in order to find BB(5).

<a id="phase-1-phase-2"></a>

### Phase 1, phase 2

The method that we present to sparsely enumerate the space of 5-state Turing machines and analyse their behavior is fundamentally inspired by [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html) with some notable differences that we will outline. The first difference is that our method is divided into two successive and independent phases:

1. **Phase 1: seed database.** Sparsely enumerate the space of 5-state Turing machines and mark as **undecided** any machine that exceeded the set [time or space limits](#time-and-space-limits). Undecided machines are put in the [seed database](#seed-database) which _seeds_ the Busy Beaver Challenge.

2. **Phase 2: deciders.** Write independent [deciders](#deciders), i.e. programs that will decide the behavior of families of machines in the seed database. We aim to classify these families in the [zoology](/#zoology) and to come up with deciders for each family.

**Phase 1** was completed in December 2021:

- it enumerated 125,479,953 Turing machines in 30 hours (splitting the task among several computers in parallel). See these [metrics](#metrics) for more.
- it marked **88,664,064** machines as undecided and they are stored in the [seed database](#seed-database). We refer to undecided 5-state machines thanks to their index in the seed database (e.g. Machine <a href="/7410754" rel="external">#7,410,754</a>).

Although **Phase 1** of the project was completed, it needs to be reproduced independently in order to confirm its results and increase trust. See <a href="/contribute" rel="external">Contribute</a>.

**Phase 2** started in January 2022 and you are invited to write your own deciders for the remaining (or yet-unknown) families and to reproduce or verify existing ones! See <a href="/contribute" rel="external">Contribute</a>.

#### Currently applied deciders

Currently applied deciders are [listed on the forum](https://discuss.bbchallenge.org/t/currently-applied-deciders/32/3) and you are invited to <a href="/contribute" rel="external">Contribute</a>.

<a id="why-two-phases"></a>

### Why two phases?

Phase 2's deciders could be integrated into the enumeration algorithm of phase 1 in order to mark a lot less than 88,664,064 machines as undecided to begin with. This is the approach taken by [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html).

However we strongly advocate for our model where responsibility is split into two independent phases, that is because:

1. Splitting responsibilities yields shorter and easier to verify/test/debug code for both phases. In particular, it is very important to establish trust in the seed database of undecided machines hence the simpler the code that generates it the better.

2. Some deciders require a lot more resources than others and might only be relevant to a very small and targetted subset of machines. Hence we don't want to execute them on all enumerated machines which would considerably slow down the enumeration process.

Our approach provides modularity and hopefully facilitates reproducibility, peer reviewing, and trust in the final result.

<a id="seed-database"></a>

## Seed database

The Busy Beaver Challenge is based on a [downloadable](#download) seed database of 88,664,064 undecided 5-state machines which was constructed during [phase 1](#phase-1-phase-2) of the project, completed in December 2021. You are more than invited to reproduce this result, see <a href="/contribute" rel="external">Contribute</a>.

The code to construct the seed database is available at [https://github.com/bbchallenge/bbchallenge-seed](https://github.com/bbchallenge/bbchallenge-seed). This code is open source and was built with readibility and concision in mind: it "only" consists of 675 lines of Go and 105 lines of C and is unit tested. See our <a href="#reproducibility-and-verifiability-statement">reproducibility and verifiability statement</a>.

This is to be compared to the unpublished ≈8000 lines of C reported by [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#Enumeration) or the ≈6000 uncommented lines of Pascal of [https://skelet.ludost.net/bb/nreg.html](https://skelet.ludost.net/bb/nreg.html) and justifies our clear separation between [phase 1 and phase 2](#phase-1-phase-2) in this project.

The main aim of the Busy Beaver Challenge is to decide every machine in the seed database.

<a id="construction"></a>

### Construction

The algorithm that we implement to sparsely enumerate the space of 5-state Turing machines is a variation of [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#Enumeration) but the core idea is the same.

The algorithm recursively constructs the tree of 5-state Turing machines starting from the following common ancestor:

<div class="flex flex-col items-center">
<div class="w-1/3 -mt-5 font-mono">

|     | 0   | 1   |
| --- | --- | --- |
| A   | 1RB | --- |
| B   | --- | --- |
| C   | --- | --- |
| D   | --- | --- |
| E   | --- | --- |

</div>
</div>

Each machine (i.e. node of the tree) is simulated until either:

1. [time or space limits](#time-and-space-limits) are met
2. the machine exceeds BB(4) = 107 time steps while having visited only 4 states out of 5
3. an undefined transition is met

In **case 1**. the machine is marked as **undecided** and is inserted in the seed database. <span class="text-sm">Note that introducing the idea of [a space limit](#bbspace) is novel compared to [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#Enumeration). We conjecture that BB_SPACE(5) = 12,289.</span>

In **case 2.** the machine is marked as **non-halting**, see <a href="/story" rel="external">Story</a> for more details on BB(4).

In **case 3.** there are naïvely <Katex math="2*2*5=20"/> choices for the undefined transition that was encountered. This number of choices is reduced by imposing an order on the set of states as this allows not to visit machines that are the same up to renaming of the states (_isomorphic machines_). Further pruning methods are implemented to discard redundant machines. The algorithm is then applied recursively to the machines equipped of their new transition.

Complete pseudo-code and details of the construction are available [on the forum](https://discuss.bbchallenge.org/c/seed-database/6).

Thanks to (a) using a [space limit](#bbspace), (b) using low level code for the simulation algorithm and (c) using 2021's computers we do not need to burden the algorithm's code with simulation speed-ups as in [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#Acceleration).

<a id="time-and-space-limits"></a>

#### Time and space limits

During the enumeration algorithm we need a criterion to stop simulating machines that have been running for too long and mark them as **undecided**. We use the conjectured value of BB(5) = 47,176,870 steps as a cut-off time limit [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#http://turbotm.de/~heiner/BB/mabu90.html) [[Aaronson, 2020]](https://www.scottaaronson.com/papers/bb.pdf).

We introduce the idea of a space limit. Indeed the busy beaver value is traditionally concerned with time only. But we can also ask an analogous question about **space**: "what is the maximum number of memory cells that a 5-state machine can visit before halting?".

<a id="bbspace"></a>

#### BB_SPACE

We define BB_SPACE:

<div class="flex justify-center items-center space-x-2">
<div>
BB_SPACE(n) = 
</div><div class="text-sm w-[300px]">Maximum number of  memory cells visited by a halting Turing machine with n states starting from all-0 memory tape</div>
</div>

Note that BB_SPACE **is not** Rado's <Katex math="\Sigma"/> function which is the maximum number of 1s on the final tape of a n-state halting Turing machine from all-0 tape, [[Rado, 1962]](https://cs.famaf.unc.edu.ar/~hoffmann/cc18/Rado-On-non-computable.pdf).

We conjecture:

<div class="flex justify-center">
BB_SPACE(5) =  12,289
</div>

Which is the number of memory cells visited by <a  href="https://bbchallenge.org/{BB5_champion}&w=250&ox=0.8&status=halt" rel="external">the 5-state busy beaver time champion</a>.

It turns that BB_SPACE(5) is a much more practical cut-off to use in the enumeration algorithm than BB(5) as many more machines will visit more than 12,289 memory cells before they exceed 47,176,870 time steps.

Note that if our conjecture is false, i.e. if BB_SPACE(5) > 12,289, the true BB_SPACE winner is necessarily in the seed database and should hopefully be discovered through the effort of deciding the database. Same if BB(5) > 47,176,870.

<a id="metrics"></a>

#### Metrics

The enumeration algorithm was run in December 2021 and here are some metrics about the enumerated space of 5-state Turing machines:

|                                          | # machines  | # machines | # machines |
| ---------------------------------------- | ----------- | ---------- | ---------- |
| total halting (undefined transition met) |             | 34,104,723 |
| total non-halting (using BB(4))          |             | 2,711,166  |
| total pruned                             |             | 944,579    |
| total undecided (time limit)             |             |            | 14,322,029 |
| total undecided (space limit)            |             |            | 74,342,035 |
| total undecided                          |             | 88,664,064 |            |
| total enumerated                         | 126,424,532 |            |

<a id="download"></a>

### Download

<a id="#mirrors"></a>

#### Mirrors

The seed database of 88,664,064 undecided 5-state machines is available for download at:

- <a rel="external" href="http://docs.bbchallenge.org/all_5_states_undecided_machines_with_global_header.zip" download>http://docs.bbchallenge.org/all_5_states_undecided_machines_with_global_header.zip</a>
- [ipfs://QmcgucgLRjAQAjU41w6HR7GJbcte3F14gv9oXcf8uZ8aFM](ipfs://QmcgucgLRjAQAjU41w6HR7GJbcte3F14gv9oXcf8uZ8aFM)

The zipped database is 243M and approx 2G unzipped, each machine is encoded on 30 bytes and the first 30 bytes consist of a reserved header, see [format](#format).

Database shasum:

1. zipped: `2576b647185063db2aa3dc2f5622908e99f3cd40`
2. unzipped: `e57063afefd900fa629cfefb40731fd083d90b5e`

You are welcome to host the database on your own mirror (as long as preserving shasum), see
<a href="/contribute" rel="external">Contribute</a>.

<a id="format"></a>

### Format

The database is a binary file where each machine is described on 30 bytes. It starts with a 30-byte reserved **header** which currently contains the following information (first 13 bytes):

1. `14,322,029`: number of undecided machines that exceeded the 47M steps time limit. <span class="text-xs">4-byte big endian integer</span>
2. `74,342,035`: number of undecided machines that exceeded the 12k cells space limit. <span class="text-xs">4-byte big endian integer</span>
3. `88,664,064`: total number of undecided machines. <span class="text-xs">4-byte big endian integer</span>
4. `1`: a boolean indicating that the machines were lexicographically sorted. The first 14,322,029 undecided machines (47M time limit exceeded) were lexicographically sorted independently of the next 74,342,035 undecided machines (12k space limit exceeded). <span class="text-xs">1-byte boolean</span>

Then, each machine is encoded on 30 bytes. First come the `14,322,029` machines that exceeded the time limit and then the `74,342,035` machines that exceeded the space limit, see [time and space limits](#time-and-space-limits). These two sets of machines are both lexicographically sorted.

The 30-byte encoding of a 5-state Turing machine is better understood with an example, for instance with machine [#7,103,458](https://bbchallenge.org/7103458) of the databse:

<div class="flex flex-col items-center">
<div class="w-1/3 -mt-5 font-mono">

|     | 0   | 1   |
| --- | --- | --- |
| A   | 1RB | 0LD |
| B   | 0LC | 1LE |
| C   | 1LD | 1LC |
| D   | 0RA | --- |
| E   | 1RB | 1RE |

</div>
</div>

The machine is encoded using the following 30-byte array, with R=0 and L=1:

```
[1,R,2, 0,L,4,
 0,L,3, 1,L,5,
 1,L,4, 1,L,3,
 0,R,1, 0,0,0,
 1,R,2, 1,R,5]
```

Note that states are indexed starting at A=1 as the state value 0 is used to encode undefined transitions. Write and direction bytes of undefined transitions are set to 0 as well.

#### Use the database

Here are some routines that you can use to extract machines from the database:

_Python_

```python
def get_header(machine_db_path):
  with open(machine_db_path, "rb") as f:
    return f.read(30)

def get_machine_i(machine_db_path, i, db_has_header=True):
  with open(machine_db_path, "rb") as f:
    c = 1 if db_has_header else 0
    f.seek(30*(i+c))
    return f.read(30)
```

More Python utils at [https://github.com/bbchallenge/bbchallenge-py/](https://github.com/bbchallenge/bbchallenge-py/)

_Go_

```go
type TM [30]byte

func GetMachineI(db []byte, i int, hasHeader bool) (tm TM, err error) {
  if i < 0 || i > len(db)/30 {
    err := errors.New("invalid db index")
    return tm, err
  }

  offset := 0
  if hasHeader {
    offset = 1
  }

  copy(tm[:], db[30*(i+offset):30*(i+offset+1)])
  return tm, nil
}
```

More go utils at [https://github.com/bbchallenge/bbchallenge-go/](https://github.com/bbchallenge/bbchallenge-go/)

<a id="api"></a>

### API

You can also query the database through the following API:

```
GET https://api.bbchallenge.org/machine/<machine_id>
```

For instance, [https://api.bbchallenge.org/machine/12345678](https://api.bbchallenge.org/machine/12345678) will return:

```json
{
	"machine_code": "1RB1LC_1RC1RC_1LB1RD_1LA1LE_---0RA",
	"machine_id": 12345678,
	"status": "decided"
}
```

- The field "machine_code" is the string representation of the machine.

- The field "machine_id" is the ID that you queried.

- The field "status" keeps track of the deciders that have been applied to the database, the goal is for all machines to become "decided". For instance, this machine was decided by the decider for [Cyclers](link).

The goal is for all the machines of the database to eventually be decided by [Deciders](#deciders).

<a id="deciders"></a>

## Deciders

<a id="definition"></a>

### Definition

A decider is a program that outputs `true` if it is able to tell whether a given machine halts or not. Deciders are applied to the machines of the [seed database](#seed-database) in order to reduce the number of undecided machines from 88,664,064 to 0.

We expect that almost all machines of the seed database do not halt hence deciders are primarily focused on deciding that machines do not halt.

To be trusted, a decider should be accompanied with a proof of correctness which certifies that the machines that it recognises do not halt. The decider's code should also be tested on a significant number of examples and counterexamples machines, see <a href="/contribute" rel="external">Contribute</a>.

Deciders are closely related to the [zoology](/#zoology) of 5-state machines as we aim to decide each family of the zoo. For instance:

- 11,229,238 _Cyclers_, such as Machine <a href="/123" rel="external">#123</a>, were decided by the [decider for cyclers](https://discuss.bbchallenge.org/t/decider-cyclers/33).

- 73,860,604 _Translated Cyclers_, such as Machine <a href="/59090563" rel="external">#59,090,563</a>, were decided by the [decider for translated cyclers](https://discuss.bbchallenge.org/t/decider-translated-cyclers/34).

Deciders are not _necessarily_ directly connected to a family of the [zoology](/#zoology), a good example of this case is [the decider for Backward Reasoning](https://discuss.bbchallenge.org/t/decider-backward-reasoning/35) a notion developed in [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#http://turbotm.de/~heiner/BB/mabu90.html#Nontermination).

Writing, testing and proving deciders is a collaborative task, see [the decider section of the forum](https://discuss.bbchallenge.org/c/deciders/5), and you are invited to <a href="/contribute" rel="external">Contribute</a>.

Trusted deciders are applied to the seed database.

<a id="undecided-machines-index-file"></a>

### Undecided machines index file

[Download the index file](https://github.com/bbchallenge/bbchallenge-undecided-index/) containing all the indices in the [seed database](#seed-database) of the currently undecided machines (i.e. machines that remain undecided after all trusted [deciders](#deciders) are applied).

Machines' indices are stored in order as 4-byte big endian integers. Here are some routines to extract these indices from an index file:

_Python_

```python
def get_indices_from_index_file(index_file_path):
  index_file_size = os.path.getsize(index_file_path)

  machines_indices = []
  with open(index_file_path, "rb") as f:
    for i in range(index_file_size//4):
      chunk = f.read(4)
      machines_indices.append(int.from_bytes(chunk, byteorder="big"))

  return machines_indices
```

_Go_

```go
func GetIndicesFromIndexFile(indexFilePath string) (
  machinesIndices []uint32, err error) {

  var rawIndex []byte
  rawIndex, err = ioutil.ReadFile(indexFilePath)

  if err != nil {
    return machinesIndices, err
  }

  for i := 0; i < len(rawIndex)/4; i += 4 {
    machinesIndices = append(
    machinesIndices, binary.BigEndian.Uint32(rawIndex[i:i+4]))
  }

  return machinesIndices, err
}

```

<a id="reproducibility-and-verifiability-statement"></a>

## Reproducibility and verifiability statement

Any result coming from the Busy Beaver Challenge will be fundamentally based on the numerous programs involved in the project such as the [seed database](#seed-database)'s generating code or the [deciders](#deciders).

Because programs can contain bugs (and often do), such computer-based results tend to struggle gaining trust among the scientific community, where the gold standard is mathematical proof in a peer-reviewed publication.

Because we aim to achieve this standard, the following principles are at the core of the Busy Beaver Challenge. Any program involved in the project must be:

1.  Open source
2.  Open to collaboration
3.  Modular, concise and clear
4.  Documented and unit tested
5.  Reproducible with clear build/run instructions
6.  Eventually accompanied by a proof of correctness

For deciders, we detail the reproducibility rules in this [validation process](https://discuss.bbchallenge.org/t/debate-vote-deciders-validation-process/85).

We would encourage the use of automatic proving tools such as [Lean](https://leanprover.github.io/) or [Coq](https://coq.inria.fr/) although it would be an extremely demanding endeavour.

You are invited to <a href="/contribute" rel="external">Contribute</a> at making the Busy Beaver Challenge more reproducible and verifiable.

<div class="mb-20"></div>

</div>
</div>
</div>
</div>
