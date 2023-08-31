import { Nosft } from "nosft-core";
import * as constants from "@lib/constants.config";

// Create an object with the exported module constants
const localConfig = {
  ...constants,
};

const nosft = Nosft({ ...localConfig });

const { connectWallet, onAccountChange } = nosft.wallet;
const { getAddressInfo } = nosft.address;
const { doesUtxoContainInscription, getAddressUtxos, isSpent, getOutput } =
  nosft.utxo;
const {
  getInscription,
  getInscriptions,
  invalidateOutputsCache,
  isTextInscription,
  isImageInscription,
  shouldReplaceInscription,
  takeLatestInscription,
} = nosft.inscriptions;

const {
  signPsbtMessage,
  broadcastTx,
  signAndBroadcastUtxo,
  getPsbt,
  getPsbtBase64,
  getMetamaskSigner,
  signSigHash,
  createAndSignPsbtForBoost,
  createPsbtForBoost,
  signPsbtListingForBuy,
  signPsbtListingForBid,
  signAcceptBid,
  signPsbtForBoost,
} = nosft.psbt;
const {
  publishOrder,
  signAndBroadcastEvent,
  getNostrInscription,
  getNostrInscriptions,
  getLatestSellNostrInscription,
  getNostrBid,
  subscribeOrders,
  unsubscribeOrders,
} = nosft.nostr;

const {
  subscribeOrders: subscribeAuctionOrders,
  getAuctionByInscription,
  createAuction,
  cancelAuction,
  listAuctionInscriptions,
  getAuctionByCollection,
  subscribeMyAuctions,
} = nosft.auction;

const {
  getFundingUtxosForBuy,
  getFundingUtxosForBid,
  generatePSBTListingInscriptionForBuy,
  generatePSBTListingInscriptionForSale,
  generateBidPSBT,
  getOrderInformation,
  generateDeezyPSBTListingForBuy,
  generateDeezyPSBTListingForBid,
  calculateRequiredFeeForBuy,
} = nosft.openOrdex;

const {
  shortenStr,
  satsToFormattedDollarString,
  fetchBitcoinPrice,
  outputValue,
  partialOutputValue,
  toXOnly,
  sortUtxos,
  parseOutpoint,
  fetchRecommendedFee,
  satToBtc,
  calculateFee,
  getTxHexById,
  tweakSigner,
  fetchBlockAverage,
} = nosft.crypto;

const { getCollection, getInscriptions: getCollectionInscriptions } =
  nosft.collection;

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
  // Address
  getAddressInfo,

  // Wallet
  connectWallet,
  onAccountChange,

  // Crypto
  shortenStr,
  satsToFormattedDollarString,
  fetchBitcoinPrice,
  outputValue,
  partialOutputValue,
  toXOnly,
  sortUtxos,
  parseOutpoint,
  fetchRecommendedFee,
  satToBtc,
  calculateFee,
  getTxHexById,
  tweakSigner,
  fetchBlockAverage,

  // utxo
  doesUtxoContainInscription,
  getAddressUtxos,
  isSpent,
  getOutput,

  // inscriptions
  getInscription,
  getInscriptions,
  invalidateOutputsCache,
  isTextInscription,
  isImageInscription,
  shouldReplaceInscription,
  takeLatestInscription,

  // psbt
  signPsbtMessage,
  broadcastTx,
  signAndBroadcastUtxo,
  getPsbt,
  getPsbtBase64,
  getMetamaskSigner,
  signSigHash,
  createAndSignPsbtForBoost,
  createPsbtForBoost,
  signPsbtForBoost,
  signPsbtListingForBuy,
  signPsbtListingForBid,
  signAcceptBid,

  // nostr
  publishOrder,
  signAndBroadcastEvent,
  getNostrInscription,
  getNostrInscriptions,
  getLatestSellNostrInscription,
  getNostrBid,
  subscribeOrders,
  unsubscribeOrders,

  // auction
  subscribeAuctionOrders,
  getAuctionByInscription,
  createAuction,
  cancelAuction,
  listAuctionInscriptions,
  getAuctionByCollection,
  subscribeMyAuctions,

  // open ordex
  generatePSBTListingInscriptionForBuy,
  generatePSBTListingInscriptionForSale,
  generateBidPSBT,
  generateDeezyPSBTListingForBuy,
  generateDeezyPSBTListingForBid,
  getFundingUtxosForBuy,
  getFundingUtxosForBid,
  getOrderInformation,
  calculateRequiredFeeForBuy,

  // collection
  getCollection,
  getCollectionInscriptions,

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
