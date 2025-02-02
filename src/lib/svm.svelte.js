import { mount, unmount, setContext } from 'svelte';
import { getWallets } from '@wallet-standard/app';

/**
 * Configuration
 * @typedef {object} Configuration
 * @property {Array<Chain>} chains
 * // Some connect properties
 * @property {string} WALLET_CONNECT_PROJECT_ID
 * @property {string} COINBASE_APP_NAME
 * @property {string} ALCHEMY_API_KEY
 */

/**
 * @typedef {object} SvmContext
 * @property {Configuration} configuration
 * @property {() => Promise<void>} connect
 * @property {() => Promise<void>} reconnect
 * @property {string} address
 */

/** @param {Configuration} configuration */
export default function (configuration) {
	let adapter = $state();

	async function connect(chain = 'solana', { Component }) {
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
							'@solana/wallet-standard-wallet-adapter-base'
						);

						try {
							adapter = new StandardWalletAdapter({ wallet });
							await adapter.connect();
							resolve(true);
						} catch (error) {
							console.error(error);
							resolve(false);
						}
					}
				}
			});
		});

		unmount(element);
		return connected;
	}

	async function reconnect() {
		if (!adapter) return;
		await adapter.connect();
	}

	return {
		connect,
		reconnect,
		get adapter() {
			return adapter;
		},
		get address() {
			if (!adapter) return undefined;
			return adapter.publicKey.toString();
		}
	};
}
