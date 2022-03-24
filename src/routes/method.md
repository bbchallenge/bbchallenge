<script lang="ts">
  import Katex from "../lib/Katex.svelte"
let nbTM5 = "21^{10}"
</script>

<div class="dark">
<div class="prose prose-invert text-white  -mt-4  lg:ml-[200px] ml-0 sm:ml-2 font-sans prose-base sm:prose-lg ">
<div class="leading-normal">
<div>

## Table of contents

## Overview

<a id="overview"></a>

With the busy beaver challenge we want to decide the halting problem of all 5-state Turing machines (from all-0 tape). That way we will learn BB(5), the 5<sup>th</sup> busy beaver value. See [Story](/story).

In order to achieve this goal we need to analyse the behavior of every single 5-state Turing machine. We quickly run into a problem: there are roughly 167 trillion 5-state Turing machines (<Katex math={nbTM5}/> to be exact).

Thankfully most of this space is not _useful_ to us and only a fraction needs to be studied in order to find BB(5).

<a id="phase-1-phase-2"></a>

### Phase 1, phase 2

The method that we present to enumerate the _useful_ space of 5-state Turing machines and analyse their behavior is fundamentally inspired by [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html) with some notable differences that we will outline. The first difference is that our method is divided into two successive phases:

1. **Phase 1: seed database.** Enumerate the _useful_ space of 5-state Turing machines and mark as **undecided** any machine that exceeded the set [time or space limits](#time-space-limits). This phase provides the [seed database](#seed-database) of undecided 5-state machines on which the busy beaver challenge is built.

2. **Phase 2: deciders.** Write independent [deciders](#deciders), i.e. programs that will decide the behavior of families of machines in the seed database. We aim to classify these families in the [zoology](/#zoology) and to come up with deciders for each families.

**Phase 1** was completed in December 2021:

- it enumerated 125,479,953 5-state Turing machines (that's the size of the _useful_ space) in 30 hours^[1. Splitting the task among several computers in parallel.]. See these [metrics](#metrics) for more.
- it marked **88,664,064** machines as undecided and they are stored in the [seed database](#seed-database). We refer to undecided 5-state machines thanks to their [index]() in the seed database (e.g. Machine <a href="/7410754&s=10000&w=300&ox=0.5">#7,410,754</a>).

Although **Phase 1** of the project was completed, it needs to be reproduced independently in order to confirm its results and increase trust. See [Contribute](/contribute).

**Phase 2** started in January 2022. Deciders are available at [https://github.com/bbchallenge/bbchallenge-deciders](https://github.com/bbchallenge/bbchallenge-deciders) and are also discussed on the [forum]().

For instance, [this decider](https://github.com/bbchallenge/bbchallenge-deciders/tree/main/decider-translated-cyclers) decided the family of [Translated Cyclers]() (e.g. Machine <a href="/59090563&s=10000&w=300&ox=0.5">#59,090,563</a>).

You are invited to write your own deciders for the remaining (or yet-unknown) families and to reproduce or verify existing ones! See [Contribute](/contribute).

<a id="why-two-phases"></a>

### Why two phases?

Phase 2's deciders could be integrated into the enumeration algorithm of phase 1 in order to mark a lot less than 88,664,064 machines as undecided to begin with. This is the approach taken by [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html).

However we strongly advocate for our model where responsibility is split into two independent phases, that is because:

1. Splitting responsibilities yields shorter and easier to verify/test/debug code for both phases. In particular, it is very important to establish trust in the seed database of undecided machines hence the simpler the code that generates it the better.

2. Some deciders require a lot more resources than others in order to decide machines and might only be relevant to a very small and targetted subset of machines. Hence we don't want to execute them on all machines which would considerably slow down the enumeration process.

Our approach provides modularity and hopefully facilitates reproducibility, peer reviewing, and trust in the final result.

<a id="seed-database"></a>

## Seed database

The code to construct **phase 1**'s seed database is available at [https://github.com/bbchallenge/bbchallenge-seed](https://github.com/bbchallenge/bbchallenge-seed).

This code was built with readibility and concision in mind: it "only" consists of 675 lines of Go^[2. Go is ideal for lightweight parallelisation which is very useful in this case.] and 105 lines of C. This code is also tested.

You are more than invited to run and challenge this code, see [Contribute](/contribute).

Running the algorithm resulted in a seed database of 88,664,064 machines which you are welcomed to [download and use](#download-and-use)

<a id="construction"></a>

### Construction

The algorithm that we implement to enumerate the _useful_ space of 5-state Turing machines is a variation of [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#Enumeration) but the core idea is the same.

The algorithm recursively constructs the tree of _useful_ 5-state Turing machines starting from the common ancestor of all _useful_ machines^[3. By symmetry this common ancestor can use tape movement R and go to state B without loss of generality. Writing a 1 is motivated that if it wrote a 0 instead we could shift the tape to the first cell with a 1.]:

<div class="flex flex-col items-center">
<div class="w-1/3 -mt-5 font-mono">

|     | 0   | 1   |
| --- | --- | --- |
| A   | 1RB | ??? |
| B   | ??? | ??? |
| C   | ??? | ??? |
| D   | ??? | ??? |
| E   | ??? | ??? |

</div>
</div>

Each machine (i.e. node of the tree) is simulated until either:

1. [time or space limits](#time-and-space-limits) are met
2. the machine exceeds BB(4) = 107 time steps while having visited only 4 states out of 5
3. an undefined transition is met

In **case 1**. the machine is marked as **undecided** and is inserted in the seed database. <span class="text-sm">Note that introducing the idea of [a space limit](#time-space-limits) is novel compared to [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#Enumeration). We conjecture that BB_SPACE(5) = 12,289.</span>

In **case 2.** the machine is marked as **non halting**, see [Story](/story) for more details on BB(4).

In **case 3.** there are naïvely <Katex math="2*2*5=20"/> choices for the undefined transition that was encountered. This number of choices is reduced by imposing an order on the set of states as this allows not to visit _isomorphic machines_^[4. Machines that are the same up to a renaming of the states]. Further pruning methods are implemented to discard redundant machines. The algorithm is then applied recursively to the machines equipped of their new transition.

Complete pseudo-code and details of the construction are available on the [forum](forum).

Thanks (a) using a [space limit](#bbspace), (b) using low level code for the simulation algorithm and (c) using 2021's computers we do not need to burden the algorithm's code with simulation speed-ups as in [[Marxen and Buntrock, 1990]](http://turbotm.de/~heiner/BB/mabu90.html#Acceleration).

<a id="time-and-space-limits"></a>

### Time and space limits

During the enumeration algorithm we need a criterion to stop simulating machines that have been running for too long and mark them as **undecided**. We use the conjectured value of BB(5) = 47,176,870 steps as this cut-off time limit.

We introduce the idea of a space limit. Indeed, as described in the [story](/story), the busy beaver value is traditionally concerned with time only. But we can also ask an analogous question about **space**: "what is the maximum number of memory cells that a 5-state machine can visit before halting?".

<a id="bbspace"></a>

#### BB_SPACE

We call this quantity BB_SPACE(5) and we conjecture:

<div class="flex justify-center">
BB_SPACE(5) =  12,289
</div>

Which is the number of memory cells visited by <a  href="https://bbchallenge.org/mAQACAQEDAQADAQACAQAEAAEFAQEBAQEEAQAAAAEB&s=10000&w=250&ox=0.8&status=halt" rel="external">the 5-state busy beaver time champion</a>.

It turns that that BB_SPACE is a much more practical cut-off to use in the enumeration algorithm as many more machines will visit more than 12,289 memory cells before they exceed 47,176,870 time steps.

Note that if BB_SPACE(5) <Katex math="\neq"/> 12,289 we have marked halting machines as **undecided**. But since they are in the database we should be able to find them in the future and update the conjecture accordingly. Same if BB(5) <Katex math="\neq"/> 47,176,870.

<a id="metrics"></a>

#### Metrics

The enumeration algorithm was run in December 2021 and here are some metrics about the _useful_ space of 5-state Turing machines:

|                                          | # machines  | # machines | # machines |
| ---------------------------------------- | ----------- | ---------- | ---------- |
| total halting (undefined transition met) |             | 34,104,723 |
| total non-halting (using BB(4))          |             | 2,711,178  |
| total pruned                             |             | 944 579    |
| total undecided (time limit)             |             |            | 14,322,029 |
| total undecided (space limit)            |             |            | 74,342,035 |
| total undecided                          |             | 88,664,064 |            |
| total enumerated                         | 125,479,989 |            |

<a id="download-and-use"></a>

### Download and use

<a name="#mirrors"></a>

#### Mirrors

The seed database of 88,664,064 undecided 5-state machines is available for download at:

- [https://dna.hamilton.ie/tsterin/all_5_states_undecided_machines_with_global_header.zip](https://dna.hamilton.ie/tsterin/all_5_states_undecided_machines_with_global_header.zip)
- [ipfs://QmcgucgLRjAQAjU41w6HR7GJbcte3F14gv9oXcf8uZ8aFM](ipfs://QmcgucgLRjAQAjU41w6HR7GJbcte3F14gv9oXcf8uZ8aFM)
- [https://ipfs.prgm.dev/ipfs/QmcgucgLRjAQAjU41w6HR7GJbcte3F14gv9oXcf8uZ8aFM](https://ipfs.prgm.dev/ipfs/QmcgucgLRjAQAjU41w6HR7GJbcte3F14gv9oXcf8uZ8aFM)

The zipped database is 243M zipped and approx 2G unzipped, each machine is encoded on 30 bytes and the first 30 bytes consist of a reserved header, see [format](#format).

Database shasum:

1. zipped: `2576b647185063db2aa3dc2f5622908e99f3cd40`
2. unzipped: `e57063afefd900fa629cfefb40731fd083d90b5e`

You are welcome to host the database on your own mirror (as long as preserving shasum), see [Contribute](/contribute).

<a name="#format"></a>

#### Format

The database is a binary file where each machine is described on 30 bytes. It starts with a 30-byte reserved **header** which currently contains the following information (first 13 bytes):

1. `14,322,029`: number of undecided machines that exceeded the 47M steps time limit. <span class="text-xs">4-byte big endian integer</span>
2. `74,342,035`: number of undecided machines that exceeded the 12k cells space limit. <span class="text-xs">4-byte big endian integer</span>
3. `88,664,064`: total number of undecided machines. <span class="text-xs">4-byte big endian integer</span>
4. `1`: a boolean indicating that the machines were lexicographically sorted. The first 14,322,029 undecided machines (47M time limit exceeded) were lexicographically sorted independently of the next 74,342,035 undecided machines (12k space limit exceeded). <span class="text-xs">1-byte boolean</span>

Then, each machine is encoded on 30 bytes. First come the `14,322,029` machines that exceeded the time limit and then the `74,342,035` machines that exceeded the space limit, see [time and space limits](#time-and-space-limits). These two sets of machines are both lexicographically sorted.

The 30-byte encoding of a 5-state Turing machine is better understood with an example, for instance with machine [#7,103,458](https://bbchallenge.org/7103458&s=10000&w=300&ox=0.5) of the databse:

<div class="flex flex-col items-center">
<div class="w-1/3 -mt-5 font-mono">

|     | 0   | 1   |
| --- | --- | --- |
| A   | 1RB | 0LD |
| B   | 0LC | 1LE |
| C   | 1LD | 1LC |
| D   | 0RA | ??? |
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

More python utils at [https://github.com/bbchallenge/bbchallenge-py/](https://github.com/bbchallenge/bbchallenge-py/)

_Go_

```go
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

You can also query the database through an api:

```
GET https://api.bbchallenge.org/machine/<machine_id>
```

For instance, [https://api.bbchallenge.org/machine/12345678](https://api.bbchallenge.org/machine/12345678) will return:

```json
{
	"machine": "mAQACAQEDAQADAQADAQECAQAEAQEBAQEFAAAAAAAB",
	"machine_id": 12345678,
	"status": "decided"
}
```

The field "machine" is the [base-64 representation](/story#base-64)of the 30-byte machine's description.

<a id="deciders"></a>

## Deciders

</div>
</div>
</div>
</div>
