<script>
  import "../app.css";

  import { setContext } from "svelte";
  import { mainnet, base, bsc } from "viem/chains";

  import create_evm from "svallet/evm";
  import create_svm from "svallet/svm";

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
