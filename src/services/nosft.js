import { Nosft } from "nosft-core";
import * as constants from "@lib/constants.config";

// Create an object with the exported module constants
const localConfig = {
    ...constants,
};

const nosft = Nosft({ ...localConfig });

const { connectWallet, onAccountChange } = nosft.wallet;
const { getAddressInfo } = nosft.address;
const { doesUtxoContainInscription, getAddressUtxos } = nosft.utxo;
const { getInscription, getInscriptions, isTextInscription, isImageInscription, shouldReplaceInscription } =
    nosft.inscriptions;
const {
    signPsbtMessage,
    broadcastTx,
    signAndBroadcastUtxo,
    getMetamaskSigner,
    signSigHash,
    createAndSignPsbtForBoost,
} = nosft.psbt;
const { signAndBroadcastEvent, getNostrInscription, subscribeOrders, unsubscribeOrders } = nosft.nostr;

const {
    getAvailableUtxosWithoutInscription,
    generatePSBTListingInscriptionForBuy,
    generatePSBTListingInscriptionForSale,
    getOrderInformation,
} = nosft.openOrdex;

const {
    shortenStr,
    satsToFormattedDollarString,
    fetchBitcoinPrice,
    outputValue,
    toXOnly,
    sortUtxos,
    parseOutpoint,
    fetchRecommendedFee,
    satToBtc,
    calculateFee,
    getTxHexById,
    tweakSigner,
} = nosft.crypto;

const { config } = nosft;

const {
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
    DEFAULT_DERIV_PATH,
    DUMMY_UTXO_VALUE,
    MIN_OUTPUT_VALUE,
    BOOST_UTXO_VALUE,
    FEE_LEVEL,
    DEEZY_BOOST_API,
    INSCRIBOR_URL,
    TAPROOT_MESSAGE,
} = config;

export default nosft;
export {
    getAddressInfo,

    // Wallet
    connectWallet,
    onAccountChange,

    // Crypto
    shortenStr,
    satsToFormattedDollarString,
    fetchBitcoinPrice,
    outputValue,
    toXOnly,
    sortUtxos,
    parseOutpoint,
    fetchRecommendedFee,
    satToBtc,
    calculateFee,
    getTxHexById,
    tweakSigner,

    // utxo
    doesUtxoContainInscription,
    getAddressUtxos,

    // inscriptions
    getInscription,
    getInscriptions,
    isTextInscription,
    isImageInscription,
    shouldReplaceInscription,

    // psbt
    signPsbtMessage,
    broadcastTx,
    signAndBroadcastUtxo,
    getMetamaskSigner,
    signSigHash,
    createAndSignPsbtForBoost,

    // open ordex
    getAvailableUtxosWithoutInscription,
    generatePSBTListingInscriptionForBuy,
    generatePSBTListingInscriptionForSale,
    getOrderInformation,

    // nostr
    signAndBroadcastEvent,
    getNostrInscription,
    subscribeOrders,
    unsubscribeOrders,

    // Config variables
    TAPROOT_MESSAGE,
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
    DEFAULT_DERIV_PATH,
    DUMMY_UTXO_VALUE,
    MIN_OUTPUT_VALUE,
    BOOST_UTXO_VALUE,
    FEE_LEVEL,
    DEEZY_BOOST_API,
    INSCRIBOR_URL,
};
