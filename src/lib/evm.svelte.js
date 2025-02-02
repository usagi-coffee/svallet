/** @import { Chain } from "viem/chains" */
/** @import { CreateConnectorFn } from "@wagmi/core" */

import { mount, unmount, setContext } from 'svelte';

import { createClient } from 'viem';
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
	disconnect as wagmi_disconnect
} from '@wagmi/core';
import { coinbaseWallet, injected, metaMask, walletConnect, safe } from '@wagmi/connectors';

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
 * @typedef {object} EvmContext
 * @property {object} wagmi
 * @property {Configuration} configuration
 * @property {() => Promise<void>} reconnect
 * @property {(chain: number) => Promise<void>} connect
 * @property {() => Promise<void>} disconnect
 * @property {(chain: number) => Promise<void>} switch_chain
 * @property {number} chain_id
 * @property {string} address
 */

/** @param {Configuration} configuration */
export default function (configuration) {
	/** @type {CreateConnectorFn[]} */
	const connectors = [
		injected(),
		metaMask(),
		safe(),
		typeof configuration.WALLET_CONNECT_PROJECT_ID !== 'undefined'
			? walletConnect({
					projectId: configuration.WALLET_CONNECT_PROJECT_ID,
					showQrModal: true
				})
			: undefined,
		typeof configuration.COINBASE_APP_NAME !== 'undefined'
			? coinbaseWallet({
					appName: configuration.COINBASE_APP_NAME,
					preference: 'all'
				})
			: undefined
	].filter(Boolean);

	const wagmi = $state(
		createConfig({
			chains: configuration.chains,
			storage:
				typeof window !== 'undefined' ? createStorage({ storage: window.localStorage }) : undefined,
			connectors,
			syncConnectedChain: true,
			client({ chain }) {
				return createClient({
					chain,
					transport: configuration.client_transport(chain) ?? http()
				});
			}
		})
	);

	let chain_id = $state(getChainId(wagmi));
	let address = $state();
	let recent_connector_id = $state();

	// Watch for chain changes
	watchChainId(wagmi, {
		onChange: (value) => {
			chain_id = value;
		}
	});

	// Watch for account changes
	watchAccount(wagmi, {
		onChange: (account) => {
			address = account?.address;
		}
	});

	async function reconnect() {
		recent_connector_id = await wagmi.storage?.getItem('recentConnectorId');
		if (recent_connector_id) wagmi_reconnect(wagmi);
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
					connectors: () => get_wagmi_connectors(wagmi),
					/** @param {CreateConnectorFn} connector */
					connect: async (connector) => {
						const found = get_wagmi_connections(wagmi).find(
							(cnx) => cnx.connector.type === connector.type
						);

						if (found) {
							address = found.accounts[0];
							return resolve(true);
						}

						const parameters = { connector };

						if (connector.type === 'metaMask') unmount(element);

						try {
							const wallet = await wagmi_connect(wagmi, parameters);
							address = wallet.accounts[0];

							await switch_chain(chain);
							resolve(true);
						} catch (e) {
							resolve(false);
						}
					}
				}
			});
		});

		unmount(element);
		return connected;
	}

	function disconnect() {
		wagmi_disconnect(wagmi);
	}

	return {
		configuration,
		connect,
		reconnect,
		disconnect,
		switch_chain,
		wallet_client() {
			if (!address) return;
			return getWalletClient(wagmi, { account: address });
		},
		get chain_id() {
			return chain_id;
		},
		get address() {
			return address;
		},

		// Implementation specific properties
		wagmi
	};
}
