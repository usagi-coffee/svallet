<script>
  import "../app.css";

  /** @import { EvmContext } from "$lib/evm.svelte" */
  /** @import { SvmContext } from "$lib/svm.svelte" */

  import { setContext } from "svelte";
  import { mainnet, base, bsc } from "viem/chains";

  import create_evm from "$lib/evm.svelte.js";
  import create_svm from "$lib/svm.svelte.js";

  const { children } = $props();

  const evm = create_evm({
    chains: [mainnet, base, bsc],
  });

  const svm = create_svm();

  setContext("wallet:evm", evm);
  setContext("wallet:svm", svm);

  // Reconnect the wallet if already connected before on mount
  evm.reconnect();
  svm.reconnect();
</script>

{@render children()}
