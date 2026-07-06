import { Crypto } from './crypto';
import * as bitcoin from 'bitcoinjs-lib';
import { hex } from '@scure/base';
// @ts-ignore
import * as ecc from 'tiny-secp256k1';
import SessionStorage, { SessionsStorageKeys } from '../services/session-storage';
import { NETWORK } from '../config/constants';
import { validate, Network as _ADDRESS_NETWORK } from 'bitcoin-address-validation';
const signerModule = import('@scure/btc-signer');
bitcoin.initEccLib(ecc);
const Address = function (config) {
    const cryptoModule = Crypto(config);
    const addressModule = {
        // Taproot (P2TR)
        getP2TRAddressInfo: async (pubkey) => {
            const module = await signerModule;
            const p2trAddress = module.p2tr(pubkey, undefined, config.NETWORK);
            const result = {
                ...p2trAddress,
                tapInternalKey: Buffer.from(p2trAddress.tapInternalKey),
                output: hex.encode(p2trAddress.script),
                script: Buffer.from(p2trAddress.script),
                pubkey: Buffer.from(pubkey, 'hex'),
            };
            return result;
        },
        getAddressInfo: async (pubkey) => {
            const provider = SessionStorage.get(SessionsStorageKeys.DOMAIN);
            const pubkeyBuffer = Buffer.from(pubkey, 'hex');
            console.log(`Pubkey: ${pubkey.toString()}`);
            if (provider === 'unisat.io') {
                const addrInfo = bitcoin.payments.p2tr({
                    internalPubkey: cryptoModule.toXOnly(pubkeyBuffer),
                    network: NETWORK,
                });
                return addrInfo;
            }
            if (provider === 'xverse') {
                return addressModule.getP2TRAddressInfo(pubkey);
            }
            const addrInfo = bitcoin.payments.p2tr({
                pubkey: pubkeyBuffer,
                network: NETWORK,
            });
            return addrInfo;
        },
        // P2SH-P2WPHK
        getWrappedSegwitAddressInfo: async (pubkey) => {
            const module = await signerModule;
            const p2wpkh = module.p2wpkh(hex.decode(pubkey), config.NETWORK);
            const p2sh = module.p2sh(p2wpkh, config.NETWORK);
            return {
                script: Buffer.from(p2sh.script),
                redeemScript: p2sh.redeemScript ? Buffer.from(p2sh.redeemScript) : Buffer.from([]),
            };
        },
        validateAddress: async (address) => {
            return validate(address, config.TESTNET ? _ADDRESS_NETWORK.testnet : _ADDRESS_NETWORK.mainnet);
        },
    };
    return addressModule;
};
export { Address };
