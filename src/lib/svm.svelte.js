/** @import { StandardWalletAdapter } from "@solana/wallet-standard-wallet-adapter-base" */

import { mount, unmount } from "svelte";
import { getWallets } from "@wallet-standard/app";

/**
 * Configuration
 * @typedef {object} Configuration
 */

/**
 * @typedef {ReturnType<typeof context>} SvmContext
 */

/** @param {Configuration} configuration */
export function context(configuration) {
  /** @type {StandardWalletAdapter} */
  let adapter = $state();

  /** @param {string} chain */
  async function connect(chain = "solana", { Component }) {
    let element;

    // Microtask wait to not stack dialogs (svelte bug?)
    await Promise.resolve().then(() => {});

    /** @type {boolean} */
    const connected = await new Promise((resolve) => {
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
    return Promise.resolve();
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
      if (!adapter) return Promise.reject("No account connected");
      return Promise.resolve(adapter);
    },
  };
}

export default context;
