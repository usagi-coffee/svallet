<script>
  /** @import { Connector } from '@wagmi/core' */

  /**
   * @typedef {object} Props
   * @prop {() => void} close
   * @prop {() => void} onclose
   * @prop {(connector: Connector) => void} connect
   * @prop {() => Connector[]} connectors
   */

  import InjectedIcon from "svallet/icons/injected.svg";
  import MetaMaskIcon from "svallet/icons/metamask.svg";
  import CoinbaseWalletIcon from "svallet/icons/coinbase.svg";
  import WalletConnectIcon from "svallet/icons/walletconnect.svg";
  import RabbyIcon from "svallet/icons/rabby.svg";
  import SafeIcon from "svallet/icons/safe.svg";
  import FrameIcon from "svallet/icons/frame.png";
  import BackpackIcon from "svallet/icons/backpack.png";
  import SolflareIcon from "svallet/icons/solflare.svg";

  const WalletIcons = {
    Injected: InjectedIcon,
    MetaMask: MetaMaskIcon,
    "Coinbase Wallet": CoinbaseWalletIcon,
    "Wallet Connect": WalletConnectIcon,
    Rabby: RabbyIcon,
    Safe: SafeIcon,
    Frame: FrameIcon,
    Backpack: BackpackIcon,
    Solflare: SolflareIcon,
  };

  import { dialog } from "./utils";

  /** @type {Props} */
  const { onclose = () => {}, connect, connectors } = $props();
</script>

<dialog
  id="connect-evm-wallet"
  class="bg-opacity-50 fixed top-[50%] left-[50%] max-w-[320px] translate-x-[-50%] translate-y-[-50%] transform rounded bg-white p-1 shadow-lg"
  use:dialog={{ onclose }}
>
  <div class="flex flex-col items-stretch rounded p-4 gap-2">
    <p class="text-xl text-center py-2">Your custom connect dialog</p>

    {#each connectors() as connector}
      {@const Icon = WalletIcons[connector.name]}

      <button
        class="flex flex-row items-center gap-4 border p-2 rounded"
        onclick={() => connect(connector)}
      >
        <img src={Icon} class="h-8 w-8" alt={connector.name} />
        <p class="flex-1">
          {connector.name}
        </p>
      </button>
    {:else}
      <p class="text-center">
        No connectors found (do you have a wallet installed?)
      </p>
    {/each}
  </div>
</dialog>
