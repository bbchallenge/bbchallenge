<div class="dark w-full ">
<div class="prose prose-invert text-white -mt-4  xl:justify-start lg:ml-[170px] ml-0 sm:ml-4 font-sans prose-base sm:prose-lg w-full">
<div class="leading-normal ">
<div>

## Table of Contents

## Contribute

<a id="contribute"></a>

The busy beaver challenge is a collaborative project and there are many ways in which you can contribute to it. Our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a> outlines our philosophy regarding contributions to the busy beaver challenge.

<a id="write-deciders"></a>

## Write deciders

Reaching <a href="/story#goal" rel="external">the goal</a> of the busy beaver challenge requires to decide the behavior of 88,664,064 Turing machines. We hope to do this automatically by writing <a href="/method#deciders" rel="external">deciders</a> which are programs that decide if machines halt or not.

You are invited to write deciders in order to further reduce the number of undecided machines in the <a href="/method#seed-database" rel="external">seed database</a>.

Places to look at if this task interests you:

- The [forum](#) maintains the list of all <a href="/method#deciders" rel="external">deciders</a>

- The <a href="/#zoology">zoology</a> provides families of behaviors that could be automatically recognised and decided

- The <a href="/method#undecided-machines-index-file">undecided machines index file</a> gives you the indices of the currently undecided machines in the <a href="/method#seed-database" rel="external">seed database</a>

If you write a decider for the busy beaver challenge we ask that you:

1. Read our our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a>
2. Create a post presenting your decider on the [forum](#)
3. Give the <a href="/method#seed-database" rel="external">seed database's</a> indices of the machines that your decider has decided
4. Write tests for your deciders against example machines and counterexample machines in the <a href="/method#seed-database" rel="external">seed database</a>

If consensus is reached that your decider is correct, it will be applied to the <a href="/method#seed-database" rel="external">seed database</a> and used to produce a new version of the <a href="/method#undecided-machines-index-file">undecided machines index file</a>.

<a id="write-proofs"></a>

## Write proofs

<a id="deciders"></a>

### Deciders

As advocated for in our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a> it is very important that deciders are proved correct.

Places to look at if this task interests you:

- The [forum](#) maintains the list of all <a href="/method#deciders" rel="external">deciders</a> and is a good place to discuss about correctness and publish proofs

You can post your proofs on the thread related to the decider that you proved.

We would encourage the use of automatic proving tools such as [Lean](https://leanprover.github.io/) or [Coq](https://coq.inria.fr/) although it would be an extremely demanding endeavour.

<a id="individual-machines"></a>

### Individual machines

It is most likely that some machine will be needed to be decided by hand. For instance, see <a href="https://github.com/danbriggs/Turing">Dan Briggs' github</a> about <a href="/story#skelets-43-undecided-machines" rel="external">Skelet's machines</a>.

We collect these individual proofs on the [forum](#). Please create a new post for each proof indicating in the title the ID in the <a href="/method#seed-database" rel="external">seed database</a> of the machine that you are deciding.

<a id="reproduce-results"></a>

## Reproduce results

To increase trust in the results of the busy beaver challenge it is important for independent reproduction of its results. See our <a href="/method#reproducibility-and-verifiability-statement" rel="external">reproducibility and verifiability statement</a>.

This can for instance be done by reproducing <a href="/method#deciders" rel="external">deciders</a> or the code that generated the <a href="/method#seed-database" rel="external">seed database</a>.

Places to look at if this task interests you:

- The code that generated the <a href="/method#seed-database" rel="external">seed database</a> is available [here](https://github.com/bbchallenge/bbchallenge-seed) and is discussed on the [forum](#)

- The [forum](#) maintains the list of all <a href="/method#deciders" rel="external">deciders</a>, you can pick one and try to reproduce it and see if yours decide the same machines

If you reproduce results of the busy beaver challenge please share about your reproduction on the dedicated section of the [forum](#).

<a id="this-webiste"></a>

## This website

This website is also written collaboratively, [its code](https://github.com/bbchallenge/bbchallenge) can be improved in many ways!

Here are some examples of missing features:

- A better, more customizable, visualisation tool for <a href="/story#space-time-diagrams">space-time diagrams</a>. See [this issue](https://github.com/bbchallenge/bbchallenge/issues/2).
- If a machine of the database is decided, such as <a href="https://bbchallenge.org/59090563&s=10000&w=300&ox=0.5" rel="external">#59,090,563</a>, give the link to its decider. See [this issue](#).

Pages like <a href="/story" rel="external">/story</a>, <a href="/method" rel="external">/story</a>, <a href="/contribute" rel="external">/contribute</a> are also collaborative and you can submit changes on [github](https://github.com/bbchallenge/bbchallenge).

<a id="share-the-story"></a>

## Share the story

If you are interested in the busy beaver challenge please don't hesitate to talk about it around you and share <a href="https://bbchallenge.org" rel="external">https://bbchallenge.org</a>.

If you are a teacher and would like to engage with your students on this topic some [teaching material](#) (which you can contribute to improve!) is available on the forum.

The <a href="/story#goal" rel="external">goal</a> of the busy beaver challenge can only be achieved collaboratively.

<div class="mb-40">

</div>

</div>
</div>
</div>
</div>
