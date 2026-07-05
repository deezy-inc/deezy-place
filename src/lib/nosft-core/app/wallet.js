import * as bitcoin from 'bitcoinjs-lib';
// @ts-ignore
import * as ecc from 'tiny-secp256k1';
import { getAddress } from 'sats-connect';
import { ethers } from 'ethers';
import { BIP32Factory } from 'bip32';
import { Crypto } from './crypto';
import SessionStorage, { SessionsStorageKeys } from '../services/session-storage';
import { METAMASK_PROVIDERS, NETWORK, NETWORK_NAME } from '../config/constants';
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);
// Used to prove ownership of addpusress and associated ordinals
// https://github.com/LegReq/bip0322-signatures/blob/master/BIP0322_signing.ipynb
export const isMetamaskProvider = (provider) => METAMASK_PROVIDERS.includes(provider);
const Wallet = function (config) {
    const cryptoModule = Crypto(config);
    const walletModule = {
        getUnisatPubKey: async () => {
            await window.unisat.requestAccounts();
            return window.unisat.getPublicKey();
        },
        getEthPubKey: async (metamaskDomain) => {
            const { ethereum } = window;
            let ethAddress = ethereum.selectedAddress;
            if (!ethAddress) {
                await ethereum.request({ method: 'eth_requestAccounts' });
                ethAddress = ethereum.selectedAddress;
            }
            // @ts-ignore
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const toSign = `0x${Buffer.from(config.TAPROOT_MESSAGE(metamaskDomain)).toString('hex')}`;
            const signature = await provider.send('personal_sign', [toSign, ethAddress]);
            const seed = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.arrayify(signature)));
            const root = bip32.fromSeed(Buffer.from(seed));
            const taprootChild = root.derivePath(config.DEFAULT_DERIV_PATH);
            const taprootAddress = bitcoin.payments.p2tr({
                internalPubkey: cryptoModule.toXOnly(taprootChild.publicKey),
                network: NETWORK,
            });
            return taprootAddress?.pubkey?.toString('hex');
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
            else if (window.ethereum && isMetamaskProvider(provider)) {
                ordinalsPublicKey = (await walletModule.getEthPubKey(provider)) || '';
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
