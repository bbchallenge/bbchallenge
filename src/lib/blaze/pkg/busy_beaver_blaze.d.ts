/* tslint:disable */
/* eslint-disable */
export class Machine {
  free(): void;
  constructor(program: string);
  step(): boolean;
  count_ones(): number;
  is_halted(): boolean;
  count(early_stop_is_some: boolean, early_stop_number: bigint): bigint;
  state(): number;
  tape_index(): bigint;
}
export class SpaceByTimeMachine {
  free(): void;
  constructor(program: string, goal_x: number, goal_y: number, binning: boolean, skip: bigint);
  nth(n: bigint): boolean;
  step_for_secs(seconds: number, early_stop: bigint | null | undefined, loops_per_time_check: bigint): boolean;
  to_png(zero_color: string, one_color: string): Uint8Array;
  step_count(): bigint;
  count_ones(): number;
  is_halted(): boolean;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_spacebytimemachine_free: (a: number, b: number) => void;
  readonly spacebytimemachine_from_str: (a: number, b: number, c: number, d: number, e: number, f: bigint) => [number, number, number];
  readonly spacebytimemachine_nth: (a: number, b: bigint) => number;
  readonly spacebytimemachine_step_for_secs: (a: number, b: number, c: number, d: bigint, e: bigint) => number;
  readonly spacebytimemachine_to_png: (a: number, b: number, c: number, d: number, e: number) => [number, number, number, number];
  readonly spacebytimemachine_step_count: (a: number) => bigint;
  readonly spacebytimemachine_count_ones: (a: number) => number;
  readonly spacebytimemachine_is_halted: (a: number) => number;
  readonly __wbg_machine_free: (a: number, b: number) => void;
  readonly machine_from_string: (a: number, b: number) => [number, number, number];
  readonly machine_step: (a: number) => number;
  readonly machine_count_ones: (a: number) => number;
  readonly machine_is_halted: (a: number) => number;
  readonly machine_count: (a: number, b: number, c: bigint) => bigint;
  readonly machine_state: (a: number) => number;
  readonly machine_tape_index: (a: number) => bigint;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
