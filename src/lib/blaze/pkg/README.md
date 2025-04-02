# Busy Beaver Blaze

**A Turing machine interpreter and space-time visualizer, implemented in Rust and compiled to native & WebAssembly.**

- [Run this program in your web browser](https://carlkcarlk.github.io/busy_beaver_blaze/).
- Watch [an animation](https://youtu.be/IBcJ2vRHGAY) made with this program.

## Features

- Run the champion [Busy Beaver](https://en.wikipedia.org/wiki/Busy_beaver) Turing machines for millions of steps in less than a second.
- Simulate your own Turing machines.
- Visualize space-time diagrams as the Turing machine runs.
- Control speed, step count, and sampling vs. averaging:
  - Millions of steps in less than a second.
  - A billion steps in about 5 seconds.
  - 50 billion steps in about 10 minutes.
- Supports common Turing machine formats: "Symbol Major," "State Major," and ["Standard Format"](https://discuss.bbchallenge.org/t/standard-tm-text-format/60).
- Optional **perfect averaging** for tape visualization. `Smooth` defaults to 0 for fast sampling. Higher values improve quality at the cost of speed—63 enables perfect averaging.
- You can set settings via the URL hash fragment, for example, `#program=bb5&earlyStop=false&pixel_policy=3`. Include `run=true` to run the program immediately.

## Techniques

- The Turing machine interpreter is a straightforward Rust implementation.
- The space-time visualizer uses adaptive sampling:
  - Initially records the full tape at each step.
  - If the tape or step count exceeds twice the image size, it halves the sampling rate.
  - Memory and time scale with image size, not step count or tape width.
- Incrementing the smoothing level doubles both the amount of tape data averaged and the runtime. However, memory usage grows only linearly, assuming the number of steps is much larger than the tape width.
- Tips on porting Rust to WASM: [Nine Rules for Running Rust in the Browser](https://medium.com/towards-data-science/nine-rules-for-running-rust-in-the-browser-8228353649d1) (*Towards Data Science*).

## Web App Screenshot

![Busy Beaver Space-Time Diagram](Screenshot.png)

A space-time diagram of the best-known 6-state Busy Beaver after 10 billion steps. Each vertical slice represents the tape at a moment in time—dark pixels are 1s, light pixels are 0s. Time flows downward.

## Video

- [Turing Machine "BB6 Contender": 1 Billion+ Steps with Full Pixel Averaging (YouTube)](https://www.youtube.com/watch?v=jNOkv5o5cDQ)
- To render a video, edit `examples/movie.rs` to set the output directory, font, etc., then run:

  ```bash
  cargo run --example movie --release
  ```

## Related Work

- [The Busy Beaver Challenge](https://bbchallenge.org)
- [Quanta Magazine article](https://www.quantamagazine.org/amateur-mathematicians-find-fifth-busy-beaver-turing-machine-20240702/) and ["Up and Atom" video](https://www.youtube.com/watch?v=pQWFSj1CXeg&t=977s) on recent progress.
- [Fiery’s full-featured visualizer](https://fiery.pages.dev/turing/1RB1LC_0RD0RB_1RA0LC_1LD1RA) (TypeScript), used in the [Busy Beaver Challenge](https://bbchallenge.org/). It processes up to ~4 billion steps but does not animate the diagram’s development.
- For running Turing machines beyond trillions of steps, see this [math.stackexchange.com thread](https://math.stackexchange.com/questions/1202334/how-was-the-busy-beaver-candidate-fReador-6-states-calculated).

## License

This project is dual-licensed under either:

- MIT License ([LICENSE-MIT](LICENSE-MIT) or <https://opensource.org/licenses/MIT>)
- Apache License, Version 2.0 ([LICENSE-APACHE](LICENSE-APACHE) or <https://www.apache.org/licenses/LICENSE-2.0>)

## Contributing

Contributions are welcome! Feature suggestions and bug reports are appreciated.
