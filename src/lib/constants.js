// import * as env from "env-var"; // TODO: enable env vars

// export const NOSTR_RELAY_URL = "ws://localhost:7001";
export const NOSTR_RELAY_URL = "wss://nostr.openordex.org";

export const NOSTR_KIND_INSCRIPTION = 802;
export const NOSTR_SELL_KIND_INSCRIPTION = 1002;

export const INSCRIPTION_SEARCH_DEPTH = 5;
export const GITHUB_URL = "https://github.com/dannydeezy/nosft";
export const DEFAULT_FEE_RATE = 7;
export const SENDS_ENABLED = true;
export const TESTNET = false;
export const IS_PRODUCTION = !TESTNET;
export const ASSUMED_TX_BYTES = 111;
export const RELAYS = [NOSTR_RELAY_URL];

export const MAX_ONSALE = 25;

export const ORDINALS_EXPLORER_URL = !TESTNET ? "https://ordinals.com" : "https://explorer-signet.openordex.org";
export const MEMPOOL_BASE_URL = IS_PRODUCTION ? "https://mempool.space" : "https://mempool.space/signet";

export const BITCOIN_PRICE_API_URL = "https://blockchain.info/ticker?cors=true";

export const COLLECTION_AUTHOR = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];
