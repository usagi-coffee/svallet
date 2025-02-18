/** @import { Chain } from "viem/chains" */
/** @import { CreateConnectorFn } from "@wagmi/core" */

import { flushSync, mount, unmount } from "svelte";

import { createClient } from "viem";
import {
  createConfig,
  getChainId,
  getWalletClient,
  watchChainId,
  createStorage,
  watchAccount,
  connect as wagmi_connect,
  reconnect as wagmi_reconnect,
  getConnections as get_wagmi_connections,
  getConnectors as get_wagmi_connectors,
  switchChain as wagmi_switch,
  disconnect as wagmi_disconnect,
  getAccount as get_wagmi_account,
} from "@wagmi/core";
import {
  coinbaseWallet,
  injected,
  metaMask,
  walletConnect,
  safe,
} from "@wagmi/connectors";

/**
 * Configuration
 * @typedef {object} Configuration
 * @property {Array<Chain>} chains
 * @property {(chain: Chain) => any=} client_transport
 * @property {string=} WALLET_CONNECT_PROJECT_ID
 * @property {string=} COINBASE_APP_NAME
 * @property {string=} ALCHEMY_API_KEY
 */

/**
 * @typedef {ReturnType<typeof context>} EvmContext
 */

/** @param {Configuration} configuration */
export function context(configuration) {
  /** @type {CreateConnectorFn[]} */
  const connectors = [
    injected(),
    metaMask(),
    safe(),
    typeof configuration.WALLET_CONNECT_PROJECT_ID !== "undefined"
      ? walletConnect({
          projectId: configuration.WALLET_CONNECT_PROJECT_ID,
          showQrModal: true,
        })
      : undefined,
    typeof configuration.COINBASE_APP_NAME !== "undefined"
      ? coinbaseWallet({
          appName: configuration.COINBASE_APP_NAME,
          preference: "all",
        })
      : undefined,
  ].filter(Boolean);

  const wagmi = $state(
    createConfig({
      chains: configuration.chains,
      storage:
        typeof window !== "undefined"
          ? createStorage({ storage: window.localStorage })
          : undefined,
      connectors,
      syncConnectedChain: true,
      client({ chain }) {
        return createClient({
          chain,
          transport: configuration.client_transport(chain) ?? http(),
        });
      },
    }),
  );

  let chain_id = $state(getChainId(wagmi));

  // Watch for chain changes
  watchChainId(wagmi, {
    onChange: (value) => {
      chain_id = value;
    },
  });

  let recent_connector_id = $state();
  async function reconnect() {
    recent_connector_id = await wagmi.storage?.getItem("recentConnectorId");
    if (recent_connector_id) return await wagmi_reconnect(wagmi);
  }

  /** @param {number} chain */
  async function switch_chain(chain) {
    if (!chain || chain === chain_id) return;

    chain_id = chain;
    if (!noop) await wagmi_switch(wagmi, { chainId: chain });
  }

  /** @param {number} chain */
  async function connect(chain = configuration.chains[0].id, { Component }) {
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
          connectors: () => get_wagmi_connectors(wagmi),
          /** @param {CreateConnectorFn} connector */
          connect: async (connector) => {
            const found = get_wagmi_connections(wagmi).find(
              (cnx) => cnx.connector.type === connector.type,
            );

            if (found && get_wagmi_account(wagmi).isConnected) {
              return resolve(true);
            }

            const parameters = { connector };

            if (connector.type === "metaMask") unmount(element);
            try {
              await wagmi_connect(wagmi, parameters);
              await switch_chain(chain);
              resolve(true);
            } catch (e) {
              resolve(false);
            }
          },
        },
      });
    });

    unmount(element);
    return connected;
  }

  async function disconnect(address = undefined) {
    if (address) await wagmi_disconnect(wagmi, { account: address });
    else {
      while (get_wagmi_connections(wagmi).length > 0) {
        await wagmi_disconnect(wagmi);
      }
    }
  }

  return {
    configuration,
    connect,
    reconnect,
    disconnect,
    switch_chain,
    get chain_id() {
      return chain_id;
    },
    get account() {
      return get_wagmi_account(wagmi);
    },
    get address() {
      return this.account.address;
    },
    get connected() {
      return this.account.isConnected;
    },
    get wallet() {
      if (!this.account || !this.connected)
        return Promise.reject("No account connected");

      return new Promise((resolve, reject) => {
        return getWalletClient(wagmi, { account: this.address })
          .then(resolve)
          .catch(() => reject("Wallet connection expired"));
      });
    },

    // Implementation specific properties
    wagmi,
  };
}

export default context;
