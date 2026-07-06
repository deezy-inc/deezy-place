import * as bitcoin from 'bitcoinjs-lib';
export const TESTNET = false;
export const METAMASK_PROVIDERS = ['nosft.xyz', 'ordswap.io', 'generative.xyz'];
export const DEFAULT_FEE_RATE = 7;
export const ASSUMED_TX_BYTES = 111;
export const ORDINALS_EXPLORER_URL = TESTNET
    ? 'https://ordinals-api-testnet.deezy.io'
    : 'https://ordinals-api.deezy.io';
export const BITCOIN_PRICE_API_URL = 'https://blockchain.info/ticker?cors=true';
export const BITCOIN_BLOCK_AVG_API_URL = 'https://blockchain.info/q/interval?cors=true';
export const TURBO_API = TESTNET ? 'https://turbo-ordinals-testnet.deezy.io' : 'https://turbo-ordinals.deezy.io';
export const MEMPOOL_API_URL = TESTNET ? 'https://mempool.space/testnet' : 'https://mempool.deezy.io';
export const NETWORK = TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
export const NETWORK_NAME = TESTNET ? 'Testnet' : 'Mainnet';
export const DEFAULT_DERIV_PATH = "m/86'/0'/0'/0/0";
export const MIN_OUTPUT_VALUE = 600;
export const BOOST_UTXO_VALUE = 10000;
export const FEE_LEVEL = 'fastestFee'; // "fastestFee" || "halfHourFee" || "hourFee" || "economyFee" || "minimumFee"
export const INSCRIBOR_URL = TESTNET ? 'https://testnet.inscribor.com' : 'https://inscribor.com';
export const CONSTANTS = {
    TESTNET,
    DEFAULT_FEE_RATE,
    ASSUMED_TX_BYTES,
    ORDINALS_EXPLORER_URL,
    BITCOIN_PRICE_API_URL,
    TURBO_API,
    MEMPOOL_API_URL,
    NETWORK,
    NETWORK_NAME,
    DEFAULT_DERIV_PATH,
    MIN_OUTPUT_VALUE,
    BOOST_UTXO_VALUE,
    FEE_LEVEL,
    INSCRIBOR_URL,
    METAMASK_PROVIDERS,
};
