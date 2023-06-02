import * as bitcoin from "bitcoinjs-lib";
// import * as env from "env-var"; // TODO: enable env vars

export const NOSTR_KIND_INSCRIPTION = 802;
export const INSCRIPTION_SEARCH_DEPTH = 5;
export const GITHUB_URL = "https://github.cosm/dannydeezy/nosft";
export const DEFAULT_FEE_RATE = 7;
export const SENDS_ENABLED = true;
export const TESTNET = false;
export const ASSUMED_TX_BYTES = 111;
export const ORDINALS_EXPLORER_URL = "https://ordinals-api.deezy.io";
export const RELAYS = [
    "wss://relay.deezy.io",
    "wss://relay.damus.io",
    "wss://nostr-pub.wellorder.net",
    "wss://nostr.bitcoiner.social",
];
export const MAX_LIMIT_ONSALE = 15;
export const MAX_FETCH_LIMIT = 200;
export const MAX_ONSALE = 15;
export const MIN_ONSALE = 5;
export const ONSALE_BATCH_SIZE = 5;
export const BITCOIN_PRICE_API_URL = "https://blockchain.info/ticker?cors=true";
export const TURBO_API = "https://turbo-ordinals.deezy.io";
export const MEMPOOL_API_URL = TESTNET ? "https://mempool.space/signet" : "https://mempool.deezy.io";
export const NETWORK = TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
export const DEFAULT_DERIV_PATH = "m/86'/0'/0'/0/0";
export const DUMMY_UTXO_VALUE = 600;
export const MIN_OUTPUT_VALUE = 600;
export const BOOST_UTXO_VALUE = 10000;
export const FEE_LEVEL = "hourFee"; // "fastestFee" || "halfHourFee" || "hourFee" || "economyFee" || "minimumFee"

// Later we can sort by priority
export const OUTXO_PRIOTITY = {
    "image/png": 0,
    "image/jpeg": 1,
    "image/webp": 2,
    "image/gif": 3,
    "video/webm": 4,
    "text/plain": 100,
    "application/json": 200,
    "text/html": 300,
};
export const DEFAULT_UTXO_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "video/webm",
    "text/plain;charset=utf-8",
    "application/json",
    "text/html;charset=utf-8",
];

export const HIDE_TEXT_UTXO_OPTION = "hide .txt";
export const OTHER_UTXO_OPTION = "other";

export const DEFAULT_UTXO_OPTIONS = [HIDE_TEXT_UTXO_OPTION, ...DEFAULT_UTXO_TYPES, OTHER_UTXO_OPTION];
