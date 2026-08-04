import { getAddress } from 'sats-connect';
import SessionStorage, { SessionsStorageKeys } from '../services/session-storage';
import NostrKey, { NOSTR_PROVIDER } from '../services/nostr-key';
import { NETWORK_NAME } from '../config/constants';
const Wallet = function (config) {
    const walletModule = {
        getUnisatPubKey: async () => {
            await window.unisat.requestAccounts();
            return window.unisat.getPublicKey();
        },
        getNostrPubKey: async () => {
            // @ts-ignore
            if (window.nostr && window.nostr.enable) {
                // @ts-ignore
                await window.nostr.enable();
            }
            else {
                throw new Error("Oops, it looks like you haven't set up your Nostr key yet or installed Metamask." +
                    'Go to your Alby Account Settings and create or import a Nostr key.');
            }
            // @ts-ignore
            return window.nostr.getPublicKey();
        },
        getXverseKeys: async () => {
            const getAddressOptions = {
                onCancel: () => { },
                onFinish: () => { },
                payload: {
                    purposes: ['ordinals', 'payment'],
                    message: 'Address for receiving Ordinals',
                    network: {
                        type: NETWORK_NAME,
                    },
                },
            };
            const wallet = await new Promise((resolve, reject) => {
                getAddressOptions.onFinish = (response) => {
                    const { publicKey: xOrdinalPublicKey, address: xOrdinalAddress } = response.addresses.find((address) => address.purpose === 'ordinals') || { publicKey: '', address: '' };
                    const { publicKey: xPaymentPublicKey, address: xPaymentAddress } = response.addresses.find((address) => address.purpose === 'payment') || { publicKey: '', address: '' };
                    resolve({
                        ordinalsPublicKey: xOrdinalPublicKey,
                        paymentPublicKey: xPaymentPublicKey,
                        ordinalsAddress: xOrdinalAddress,
                        paymentAddress: xPaymentAddress,
                    });
                };
                getAddressOptions.onCancel = () => {
                    reject(new Error('Request canceled.'));
                };
                getAddress(getAddressOptions);
            });
            return wallet;
        },
        connectWallet: async (provider) => {
            const walletName = provider?.split('.')[0] || '';
            let ordinalsPublicKey = '';
            let paymentPublicKey = '';
            let ordinalsAddress = '';
            let paymentAddress = '';
            if (provider === 'unisat.io' && window.unisat) {
                ordinalsPublicKey = await walletModule.getUnisatPubKey();
            }
            else if (provider === 'xverse') {
                const xverse = await walletModule.getXverseKeys();
                ordinalsPublicKey = xverse.ordinalsPublicKey;
                paymentPublicKey = xverse.paymentPublicKey;
                ordinalsAddress = xverse.ordinalsAddress;
                paymentAddress = xverse.paymentAddress;
                // provider === 'alby'
            }
            else if (provider === NOSTR_PROVIDER) {
                // Key was pasted into the connect modal (or restored from
                // session storage after a refresh) — nothing to request.
                ordinalsPublicKey = NostrKey.getPublicKey() || '';
                if (!ordinalsPublicKey) {
                    throw new Error('No nostr key found. Please paste your private key (nsec) to connect.');
                }
            }
            else {
                ordinalsPublicKey = await walletModule.getNostrPubKey();
            }
            return {
                walletName,
                ordinalsPublicKey,
                paymentPublicKey,
                ordinalsAddress,
                paymentAddress,
            };
        },
        onAccountChange: (callback) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            if (provider === 'unisat.io') {
                window.unisat.on('accountsChanged', callback);
            }
        },
    };
    return walletModule;
};
// Export the module
export { Wallet };
