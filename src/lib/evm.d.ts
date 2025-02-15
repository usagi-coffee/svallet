import EVM from "./evm.svelte";

declare module "svallet/evm" {
  export * from "./evm.svelte";
  export type * from "./evm.svelte";
  export default EVM;
}
