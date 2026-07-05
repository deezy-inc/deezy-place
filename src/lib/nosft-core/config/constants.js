import * as bitcoin from 'bitcoinjs-lib';
export const TESTNET = false;
export const METAMASK_PROVIDERS = ['nosft.xyz', 'ordswap.io', 'generative.xyz'];
export const NOSTR_RELAY_URL = 'wss://relay.deezy.io';
export const NOSTR_KIND_INSCRIPTION = TESTNET ? 1802 : 802; // 1802 for testnet, 802 for mainnet
export const INSCRIPTION_SEARCH_DEPTH = 5;
export const GITHUB_URL = 'https://github.cosm/dannydeezy/nosft';
export const DEFAULT_FEE_RATE = 7;
export const SENDS_ENABLED = true;
export const ASSUMED_TX_BYTES = 111;
export const ORDINALS_EXPLORER_URL = TESTNET
    ? 'https://ordinals-api-testnet.deezy.io'
    : 'https://ordinals-api.deezy.io';
export const RELAYS = [
    'wss://nostr.openordex.org',
    NOSTR_RELAY_URL,
    'wss://nostr.bitcoiner.social',
    'wss://relay.damus.io',
];
export const BITCOIN_PRICE_API_URL = 'https://blockchain.info/ticker?cors=true';
export const BITCOIN_BLOCK_AVG_API_URL = 'https://blockchain.info/q/interval?cors=true';
// 'https://turbo-deezy.herokuapp.com/pipe/https://turbo.ordinalswallet.com'
// 'https://turbo-ordinals.deezy.io'
export const TURBO_API = TESTNET ? 'https://turbo-ordinals-testnet.deezy.io' : 'https://turbo-ordinals.deezy.io';
export const BLOCKSTREAM_API = 'https://blockstream.info/api';
export const POOL_API_URL = TESTNET ? 'https://mempool.space/signet' : 'https://blockstream.info';
export const NUMBER_OF_DUMMY_UTXOS_TO_CREATE = 2;
export const MEMPOOL_API_URL = TESTNET ? 'https://mempool.space/testnet' : 'https://mempool.deezy.io';
export const NETWORK = TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
export const NETWORK_NAME = TESTNET ? 'Testnet' : 'Mainnet';
export const DEFAULT_DERIV_PATH = "m/86'/0'/0'/0/0";
export const DUMMY_UTXO_VALUE = 600;
export const MIN_OUTPUT_VALUE = 600;
export const BOOST_UTXO_VALUE = 10000;
export const FEE_LEVEL = 'fastestFee'; // "fastestFee" || "halfHourFee" || "hourFee" || "economyFee" || "minimumFee"
export const DEEZY_BOOST_API = `https://api${TESTNET ? '-testnet' : ''}.deezy.io/v1/boost`;
export const INSCRIBOR_URL = TESTNET ? 'https://testnet.inscribor.com' : 'https://inscribor.com';
export const AUCTION_URL = 'https://auction-api.deezy.io/v1';
export const CONSTANTS = {
    TESTNET,
    NOSTR_RELAY_URL,
    NOSTR_KIND_INSCRIPTION,
    INSCRIPTION_SEARCH_DEPTH,
    GITHUB_URL,
    DEFAULT_FEE_RATE,
    SENDS_ENABLED,
    ASSUMED_TX_BYTES,
    ORDINALS_EXPLORER_URL,
    RELAYS,
    BITCOIN_PRICE_API_URL,
    TURBO_API,
    BLOCKSTREAM_API,
    POOL_API_URL,
    NUMBER_OF_DUMMY_UTXOS_TO_CREATE,
    MEMPOOL_API_URL,
    NETWORK,
    NETWORK_NAME,
    DEFAULT_DERIV_PATH,
    DUMMY_UTXO_VALUE,
    MIN_OUTPUT_VALUE,
    BOOST_UTXO_VALUE,
    FEE_LEVEL,
    DEEZY_BOOST_API,
    INSCRIBOR_URL,
    AUCTION_URL,
    METAMASK_PROVIDERS,
};
