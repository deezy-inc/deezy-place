import * as bitcoin from 'bitcoinjs-lib';
export const TESTNET = false;
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
export const MIN_OUTPUT_VALUE = 600;
// Smallest value a preserved (inscription/rare-sat) output may be shaved
// down to when its padding is used to pay fees; 546 is the conservative
// dust threshold (P2TR dust is 330, legacy is 546)
export const TARGET_UTXO_SIZE = 546;
export const BOOST_UTXO_VALUE = 10000;
export const FEE_LEVEL = 'fastestFee'; // "fastestFee" || "halfHourFee" || "hourFee" || "economyFee" || "minimumFee"
// Sanity bounds against compromised/malfunctioning fee endpoints: API-supplied
// rates above MAX_FEE_RATE are rejected/clamped, and no signed transaction may
// pay more than MAX_TX_FEE_SATS in total miner fees
export const MAX_FEE_RATE = 1000; // sat/vB
export const MAX_TX_FEE_SATS = 1000000; // 0.01 BTC
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
    MIN_OUTPUT_VALUE,
    TARGET_UTXO_SIZE,
    BOOST_UTXO_VALUE,
    FEE_LEVEL,
    MAX_FEE_RATE,
    MAX_TX_FEE_SATS,
    INSCRIBOR_URL,
};
