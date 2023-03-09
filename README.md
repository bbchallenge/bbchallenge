# Busy Beaver Challenge

This is the frontend of [https://bbchallenge.org](https://bbchallenge.org).

## VSCode

If you have **VSCode** and **any VSCode-compatible container runtime** ([Docker](https://www.docker.com), [Colima](https://github.com/abiosoft/colima#readme), [Podman](https://podman.io), etc)
**installed** on your machine, you can simply use the following link:

[![Open in Dev Containers](https://img.shields.io/static/v1?label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/bbchallenge/bbchallenge.git)

This will build a development container on your machine and take care of everything for you (OS, node version, dependencies, completions).
**You do not have to do anything else.**

## Manual Install

This repository uses [pnpm](https://pnpm.io) to manage its dependencies.
Running Node 18, you can let Node manage it using:

```bash
corepack enable
```

Then, install all dependencies using:

```bash
pnpm install
```

If you do not have `postinstall` scripts enabled, you also need to
manually run its actions after install:

```bash
# Generate the `.svelte-kit/` folder, required for TypeScript to work
pnpm svelte-kit sync
```

## Develop locally

To start the development server:

```bash
pnpm dev
```

## Building locally

To build the production version:

```bash
pnpm build
```

## License

This work is dual-licensed under Apache 2.0 and MIT.
You can choose between one of them if you use this work.

`SPDX-License-Identifier: Apache-2.0 OR MIT`
