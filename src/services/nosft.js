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

// Fetch per-output data used to classify wallet utxos. Uses the turbo API
// because (unlike the ordinals explorer API) its sat_ranges include rarity.
// - runes come back as an object keyed by rune name
//   ({ "RUNE•NAME": { amount, divisibility, symbol } }); normalize to an
//   array of [name, data] entries, which is what RuneDisplay and the runes
//   checks consume.
// - rareSats is the unique list of non-common rarities across the output's
//   sat ranges (e.g. ["uncommon"]), used for the Rare Sats wallet section.
const getOutputData = async (outpoint) => {
  try {
    const data = await getOutput(outpoint);
    const runes = Array.isArray(data.runes)
      ? data.runes
      : Object.entries(data.runes || {});
    const satRanges = Array.isArray(data.sat_ranges) ? data.sat_ranges : [];
    const rareSats = [
      ...new Set(
        satRanges
          .map((range) => range?.rarity)
          .filter((rarity) => rarity && rarity !== "common")
      ),
    ];
    return { ...data, runes, rareSats };
  } catch (error) {
    console.error('Error fetching output data:', error);
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
  getOutputData,

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
