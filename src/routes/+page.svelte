<script>
  /** @import { EvmContext } from "svallet/evm" */
  /** @import { SvmContext } from "svallet/svm" */

  import { getContext } from "svelte";

  import bs58 from "bs58";

  import EvmConnect from "./EvmConnect.svelte";
  import SvmConnect from "./SvmConnect.svelte";

  /** @type {EvmContext} */
  const evm = getContext("wallet:evm");

  /** @type {SvmContext} */
  const svm = getContext("wallet:svm");

  async function connect_evm() {
    const connected = await evm.connect(1, { Component: EvmConnect });
    if (connected) {
      console.log(
        "You are connected on ",
        evm.chain_id,
        " with address ",
        evm.address,
      );
    }
  }

  async function connect_svm() {
    const connected = await svm.connect("solana", { Component: SvmConnect });
    if (connected) {
      console.log("You are connected with address ", svm.address);
    }
  }

  const template = `This dumb demo wants you to sign in with your wallet: $1`;

  async function sign_evm() {
    if (!evm.address) return;

    const wallet = await evm.wallet;
    const signature = await wallet.signMessage({
      message: template.replace("$1", evm.address),
    });

    console.log(signature);
  }

  async function sign_svm() {
    if (!svm.address) return;

    const wallet = await svm.wallet;
    const signature = bs58.encode(
      await wallet.signMessage(
        new TextEncoder().encode(template.replace("$1", svm.address)),
      ),
    );

    console.log(signature);
  }
</script>

<div class="flex flex-col p-2 gap-2">
  <button onclick={connect_evm} class="p-2 bg-blue-300 rounded">
    Connect EVM
  </button>
  <button onclick={connect_svm} class="p-2 bg-purple-300 rounded">
    Connect SVM
  </button>

  <p>
    Connected EVM: {evm.address ? evm.address : "Not Connected"}
  </p>
  <p>
    Connected SVM: {svm.address ? svm.address : "Not connected"}
  </p>

  <button onclick={sign_evm} class="p-2 bg-blue-300 rounded"> Sign EVM </button>
  <button onclick={sign_svm} class="p-2 bg-purple-300 rounded">
    Sign SVM
  </button>

  <button onclick={evm.disconnect} class="p-2 bg-red-200">
    Disconnect EVM
  </button>
  <button onclick={svm.disconnect} class="p-2 bg-red-200">
    Disconnect SVM
  </button>
</div>
