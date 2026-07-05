import { Nosft } from "@lib/nosft-core";
import * as constants from "@lib/constants.config";

// Create an object with the exported module constants
const localConfig = {
  ...constants,
};

const nosft = Nosft({ ...localConfig });

const { connectWallet, onAccountChange } = nosft.wallet;
const { getAddressInfo } = nosft.address;
const { isSpent, getOutput } = nosft.utxo;
const { getInscriptions, isImageInscription } = nosft.inscriptions;

const {
  signAndBroadcastUtxo,
  preparePsbtForMultipleSend,
  signPsbtForMultipleSend,
  broadcastPsbt,
  signSigHash,
} = nosft.psbt;

// Add rune fetching function
// The API returns runes as an object keyed by rune name
// ({ "RUNE•NAME": { amount, divisibility, symbol } }); normalize to an array of
// [name, data] entries, which is what RuneDisplay and the runes checks consume.
const getRuneData = async (outpoint) => {
  try {
    const response = await fetch(`${ORDINALS_EXPLORER_URL}/output/${outpoint}`, {
      headers: {
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const runes = Array.isArray(data.runes)
      ? data.runes
      : Object.entries(data.runes || {});
    return { ...data, runes };
  } catch (error) {
    console.error('Error fetching rune data:', error);
    return null;
  }
};

const {
  shortenStr,
  satsToFormattedDollarString,
  fetchBitcoinPrice,
  outputValue,
  toXOnly,
  fetchRecommendedFee,
  satToBtc,
} = nosft.crypto;

const { getCollection } = nosft.collection;

const { config } = nosft;

const {
  TESTNET,
  DEFAULT_FEE_RATE,
  ORDINALS_EXPLORER_URL,
  MEMPOOL_API_URL,
  MIN_OUTPUT_VALUE,
  INSCRIBOR_URL,
} = config;

export {
  // Address
  getAddressInfo,

  // Wallet
  connectWallet,
  onAccountChange,

  // Runes
  getRuneData,

  // Crypto
  shortenStr,
  satsToFormattedDollarString,
  fetchBitcoinPrice,
  outputValue,
  toXOnly,
  fetchRecommendedFee,
  satToBtc,

  // utxo
  isSpent,
  getOutput,

  // inscriptions
  getInscriptions,
  isImageInscription,

  // psbt
  signAndBroadcastUtxo,
  preparePsbtForMultipleSend,
  signPsbtForMultipleSend,
  broadcastPsbt,
  signSigHash,

  // collection
  getCollection,

  // Config variables
  TESTNET,
  DEFAULT_FEE_RATE,
  ORDINALS_EXPLORER_URL,
  MEMPOOL_API_URL,
  MIN_OUTPUT_VALUE,
  INSCRIBOR_URL,
};
