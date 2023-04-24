import { Nosft } from "nosft-core-ajs";
import { localConfig } from "@lib/constants.config";

const nosft = Nosft({ ...localConfig });

const { connectWallet } = nosft.wallet;
const { getAddressInfo } = nosft.address;

const { config } = nosft;

const {
    NOSTR_RELAY_URL,
    NOSTR_KIND_INSCRIPTION,
    INSCRIPTION_SEARCH_DEPTH,
    GITHUB_URL,
    DEFAULT_FEE_RATE,
    SENDS_ENABLED,
    TESTNET,
    ASSUMED_TX_BYTES,
    ORDINALS_EXPLORER_URL,
    RELAYS,
    MAX_ONSALE,
    ORDINALS_WALLET,
    BITCOIN_PRICE_API_URL,
    TURBO_API,
    BLOCKSTREAM_API,
    POOL_API_URL,
    MEMPOOL_API_URL,
    NETWORK,
    ORDINALS_EXPLORER_URL_LEGACY,
    DEFAULT_DERIV_PATH,
    DUMMY_UTXO_VALUE,
    FEE_LEVEL,
    TAPROOT_MESSAGE,
} = config;

export default nosft;
export {
    getAddressInfo,
    connectWallet,

    // Config variables
    TAPROOT_MESSAGE,
    NOSTR_RELAY_URL,
    NOSTR_KIND_INSCRIPTION,
    INSCRIPTION_SEARCH_DEPTH,
    GITHUB_URL,
    DEFAULT_FEE_RATE,
    SENDS_ENABLED,
    TESTNET,
    ASSUMED_TX_BYTES,
    ORDINALS_EXPLORER_URL,
    RELAYS,
    MAX_ONSALE,
    ORDINALS_WALLET,
    BITCOIN_PRICE_API_URL,
    TURBO_API,
    BLOCKSTREAM_API,
    POOL_API_URL,
    MEMPOOL_API_URL,
    NETWORK,
    ORDINALS_EXPLORER_URL_LEGACY,
    DEFAULT_DERIV_PATH,
    DUMMY_UTXO_VALUE,
    FEE_LEVEL,
};
