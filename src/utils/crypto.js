import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { ASSUMED_TX_BYTES, BITCOIN_PRICE_API_URL, FEE_LEVEL, MEMPOOL_API_URL } from "@services/nosft";

import { ECPairFactory } from "ecpair";

bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

export const outputValue = (currentUtxo, sendFeeRate, price) =>
    price || currentUtxo.value - sendFeeRate * ASSUMED_TX_BYTES;

// Assume taproot for everything
// P2TR (Pay-to-Taproot):
// Input size: ~57.5 vB (single key spend), variable for more complex scripts using Tapscript
// Output size: ~43 vB
export function calculateFee({ vins, vouts, recommendedFeeRate, includeChangeOutput = 1 }) {
    const baseTxSize = 10;
    const inSize = 57.5;
    const outSize = 43;

    const txSize = baseTxSize + vins * inSize + vouts * outSize + includeChangeOutput * outSize;
    const fee = txSize * recommendedFeeRate;

    return Math.round(fee);
}

export const shortenStr = (str) => {
    if (!str) return "";
    return `${str.substring(0, 8)}...${str.substring(str.length - 8, str.length)}`;
};

export const toXOnly = (key) => (key.length === 33 ? key.slice(1, 33) : key);

export function satToBtc(sat) {
    return Number(sat) / 10 ** 8;
}

export function satsToFormattedDollarString(sats, _bitcoinPrice) {
    return (satToBtc(sats) * _bitcoinPrice).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export const fetchBitcoinPrice = async () =>
    fetch(BITCOIN_PRICE_API_URL)
        .then((response) => response.json())
        .then((data) => data.USD.last);

export const fetchRecommendedFee = async () =>
    fetch(`${MEMPOOL_API_URL}/api/v1/fees/recommended`)
        .then((response) => response.json())
        .then((data) => data[FEE_LEVEL]);

export function tapTweakHash(pubKey, h) {
    return bitcoin.crypto.taggedHash("TapTweak", Buffer.concat(h ? [pubKey, h] : [pubKey]));
}

/* eslint-disable */
export function tweakSigner(signer) {
    function _interopNamespace(e) {
        const n = Object.create(null);
        if (e && e.__esModule) return e;
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== "default") {
                    const d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(
                        n,
                        k,
                        d?.get
                            ? d
                            : {
                                  enumerable: true,
                                  get: function () {
                                      return e[k];
                                  },
                              }
                    );
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var ecc__namespace = /*#__PURE__*/ _interopNamespace(ecc);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey = signer.privateKey;
    if (!signer.privateKey) {
        throw new Error("Private key is required for tweaking signer!");
    }
    if (signer.publicKey[0] === 3) {
        privateKey = ecc__namespace.privateNegate(privateKey);
    }
    const tweakedPrivateKey = ecc__namespace.privateAdd(
        privateKey,
        // @ts-ignore
        tapTweakHash(toXOnly(signer.publicKey), bitcoin.networks.bitcoin.tweakHash)
    );
    if (!tweakedPrivateKey) {
        throw new Error("Invalid tweaked private key!");
    }
    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: bitcoin.networks.bitcoin,
    });
}
/* eslint-enable */

export const parseOutpoint = (outpoint) => {
    const rawVout = outpoint.slice(-8);
    const txid = outpoint
        .substring(0, outpoint.length - 8)
        .match(/[a-fA-F0-9]{2}/g)
        .reverse()
        .join("");

    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    rawVout.match(/../g).forEach((b, i) => {
        view.setUint8(i, parseInt(b, 16));
    });

    const vout = view.getInt32(0, true);
    return [txid, vout];
};

export function sortUtxos(utxos) {
    const sortedData = utxos.sort((a, b) => b.status.block_time - a.status.block_time);
    return sortedData.map((utxo) => ({ ...utxo, key: `${utxo.txid}:${utxo.vout}` }));
}

export async function getTxHexById(txId) {
    return fetch(`${MEMPOOL_API_URL}/api/tx/${txId}/hex`).then((response) => response.text());
}
