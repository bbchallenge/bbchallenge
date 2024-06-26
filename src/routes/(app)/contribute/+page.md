<script lang="ts">
	import SeoTitle from "$lib/seo_title.svelte"
</script>

<SeoTitle value="Contribute" />

<div class="dark w-full ">
<div class="prose prose-invert text-white -mt-4  xl:justify-start lg:ml-[170px] ml-0 sm:ml-4 font-sans prose-base sm:prose-lg w-full">
<div class="leading-normal ">
<div>

## Table of Contents

## Contribute

<a id="contribute"></a>

<div class="flex justify-center m-0 -mt-10">
<img
					src="/branding/bbchallenge_logo_no_margins.svg"
					alt="The Busy Beaver Challenge's logo"
					class="h-[190px] m-0 p-0"
				/>
</div>

The Busy Beaver Challenge is a collaborative project and there are many ways in which you can contribute to it. Our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a> outlines our philosophy regarding contributions to the Busy Beaver Challenge.

<a id="zoology"></a>

## Zoology

We aim at collaboratively building a <a href="/contribute#zoology">zoology</a> of the machines of the Busy Beaver Challenge. This will allows us to understand what these machines are capable of and where complexity lies.

The zoology is collaborative and you can contribute to it [on the forum](https://discuss.bbchallenge.org/t/current-zoology/23).

<a id="write-deciders"></a>

## Write deciders

Reaching <a href="/story#goal" rel="external">the goal</a> of the Busy Beaver Challenge requires to decide the behavior of 88,664,064 Turing machines. We hope to do this automatically by writing <a href="/method#deciders" rel="external">deciders</a> which are programs that decide if machines halt or not.

You are invited to write deciders in order to further reduce the number of undecided machines in the <a href="/method#seed-database" rel="external">seed database</a>.

Places to look at if this task interests you:

- The forum [maintains the list of all applied deciders](https://discuss.bbchallenge.org/t/currently-applied-deciders/32)

- The <a href="/contribute#zoology">zoology</a> provides families of behaviors that could be automatically recognised and decided, more [on the forum](https://discuss.bbchallenge.org/t/current-zoology/23)

- The <a href="/method#undecided-machines-index-file">undecided machines index file</a> gives you the indices of the currently undecided machines in the <a href="/method#seed-database" rel="external">seed database</a>

If you write a decider for the Busy Beaver Challenge we ask that you:

1. Read our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a>
2. Create a post on forum [following these instructions](https://discuss.bbchallenge.org/t/currently-applied-deciders/32)
3. Give the <a href="/method#seed-database" rel="external">seed database's</a> indices of the machines that your decider has decided
4. Write tests for your deciders against example machines and counterexample machines in the <a href="/method#seed-database" rel="external">seed database</a>

If consensus is reached that your decider is correct, it will be applied to the <a href="/method#seed-database" rel="external">seed database</a> and used to produce a new version of the <a href="/method#undecided-machines-index-file">undecided machines index file</a>.

<a id="write-proofs"></a>

## Write proofs

<a id="deciders"></a>

### Deciders

As advocated for in our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a> it is very important that deciders are proved correct.

Places to look at if this task interests you:

- The forum [maintains the list of all deciders](https://discuss.bbchallenge.org/c/deciders/5) and is a good place to discuss about correctness and publish proofs
- GitHub [maintains the formal proofs](https://github.com/bbchallenge/bbchallenge-proofs) in polished form, and shows the desired end state of all proofs.
  (You don't have to know LaTeX or be comfortable writing these to contribute.)

You can post your proofs on the thread related to the decider that you proved.

We would encourage the use of automatic proving tools such as [Lean](https://leanprover.github.io/) or [Coq](https://coq.inria.fr/) although it would be an extremely demanding endeavour.

<a id="individual-machines"></a>

### Individual machines

It is most likely that some machine will be needed to be decided by hand. For instance, see <a href="https://github.com/danbriggs/Turing">Dan Briggs' github</a> about <a href="/story#skelets-43-undecided-machines" rel="external">Skelet's machines</a>.

We collect these individual proofs on the [forum](https://discuss.bbchallenge.org/c/individual-machines/7). Please create a new post in [this category](https://discuss.bbchallenge.org/c/individual-machines/7) for each proof indicating in the title the ID in the <a href="/method#seed-database" rel="external">seed database</a> of the machine that you are deciding.

<a id="reproduce-results"></a>

## Reproduce results

To increase trust in the results of the Busy Beaver Challenge it is important for independent reproduction of its results. See our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a>.

This can for instance be done by reproducing <a href="/method#deciders" rel="external">deciders</a> or the code that generated the <a href="/method#seed-database" rel="external">seed database</a>.

Places to look at if this task interests you:

- The code that generated the <a href="/method#seed-database" rel="external">seed database</a> is available [here](https://github.com/bbchallenge/bbchallenge-seed) and is discussed on the [forum](https://discuss.bbchallenge.org/c/seed-database/6)

- The forum [maintains the list of all applied deciders](https://discuss.bbchallenge.org/t/currently-applied-deciders/32), you can pick one and try to reproduce it and see if yours decide the same machines

If you reproduce results of the Busy Beaver Challenge please share about your reproduction on the [dedicated section of the forum](https://discuss.bbchallenge.org/c/results-reproduction/9).

<a id="this-website"></a>

## This website

This website is also written collaboratively, [its code](https://github.com/bbchallenge/bbchallenge) can be improved in many ways!

Pages like <a href="/story" rel="external">/story</a>, <a href="/method" rel="external">/method</a>, <a href="/contribute" rel="external">/contribute</a> are also collaborative and you can submit changes on [github](https://github.com/bbchallenge/bbchallenge).

<a id="share-the-story"></a>

## Share the story

If you are interested in the Busy Beaver Challenge please don't hesitate to talk about it around you and share <a href="https://bbchallenge.org" rel="external">https://bbchallenge.org</a>.

If you are a teacher and would like to engage with your students on this topic some [teaching material](https://discuss.bbchallenge.org/c/outreach-teaching/12) (which you can contribute to improve!) is available on the forum.

The <a href="/story#goal" rel="external">goal</a> of the Busy Beaver Challenge can only be achieved collaboratively.

<div class="mb-40">

</div>

</div>
</div>
</div>
</div>
