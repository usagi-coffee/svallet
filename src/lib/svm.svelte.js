/** @import { StandardWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base" */

import { mount, unmount, setContext } from "svelte";
import { getWallets } from "@wallet-standard/app";

/**
 * Configuration
 * @typedef {object} Configuration
 */

/**
 * @typedef {object} SvmContext
 * @property {Configuration} configuration
 * @property {(chain: string, options: { Component: any }) => Promise<boolean>} connect
 * @property {() => Promise<void>} reconnect
 * @property {() => void} disconnect
 * @property {string} address
 * @property {Promise<StandardWalletAdapter>} wallet
 */

/**
 * @param {Configuration} configuration
 * @returns {SvmContext}
 */
export default function (configuration) {
  let adapter = $state();

  async function connect(chain = "solana", { Component }) {
    let element;
    let connected = await new Promise((resolve) => {
      element = mount(Component, {
        target: document.body,
        props: {
          close: (success) => {
            resolve(success);
          },
          onclose: () => {
            resolve(false);
          },
          connectors: () => getWallets().get(),
          connect: async (wallet) => {
            const { StandardWalletAdapter } = await import(
              "@solana/wallet-standard-wallet-adapter-base"
            );

            try {
              adapter = new StandardWalletAdapter({ wallet });
              await adapter.connect();
              resolve(true);
            } catch (error) {
              console.error(error);
              resolve(false);
            }
          },
        },
      });
    });

    unmount(element);
    return connected;
  }

  async function reconnect() {
    if (!adapter) return;
    await adapter.connect();
  }

  function disconnect() {
    adapter = undefined;
  }

  return {
    configuration,
    connect,
    reconnect,
    disconnect,
    get address() {
      if (!adapter) return undefined;
      return adapter.publicKey.toString();
    },
    get wallet() {
      return Promise.resolve(adapter);
    },
  };
}
