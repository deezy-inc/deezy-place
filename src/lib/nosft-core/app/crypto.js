import * as bitcoin from 'bitcoinjs-lib';
// @ts-ignore
import * as ecc from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);
const Crypto = function (config) {
    const cryptoModule = {
        outputValue: (currentUtxo, sendFeeRate, price) => price >= 0 ? price : currentUtxo.value - sendFeeRate * config.ASSUMED_TX_BYTES,
        partialOutputValue: ({ utxoValue, sendFeeRate, sendingAmount }) => utxoValue - sendFeeRate * config.ASSUMED_TX_BYTES - sendingAmount,
        // Assume taproot for everything
        // P2TR (Pay-to-Taproot):
        // Input size: ~57.5 vB (single key spend), variable for more complex scripts using Tapscript
        // Output size: ~43 vB
        calculateFee: ({ vins, vouts, recommendedFeeRate, includeChangeOutput = 1 }) => {
            if (typeof recommendedFeeRate !== 'number' || recommendedFeeRate <= 0)
                throw new Error('Invalid fee rate.');
            const baseTxSize = 10;
            const inSize = 57.5;
            const outSize = 43;
            const txSize = baseTxSize + vins * inSize + vouts * outSize + includeChangeOutput * outSize;
            const fee = Math.round(txSize * recommendedFeeRate);
            return fee;
        },
        shortenStr: (str, size = 8) => {
            if (!str)
                return '';
            return `${str.substring(0, size)}...${str.substring(str.length - size, str.length)}`;
        },
        toXOnly: (key) => (key.length === 33 ? key.slice(1, 33) : key),
        satToBtc: (sat) => {
            return Number(sat) / 10 ** 8;
        },
        satsToFormattedDollarString: (sats, _bitcoinPrice) => {
            return (cryptoModule.satToBtc(sats) * _bitcoinPrice).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
        },
        fetchBitcoinPrice: async () => fetch(config.BITCOIN_PRICE_API_URL)
            .then((response) => response.json())
            .then((data) => data.USD.last),
        fetchBlockAverage: async () => fetch(config.BITCOIN_BLOCK_AVG_API_URL).then((response) => response.text()),
        fetchRecommendedFee: async () => fetch(`${config.MEMPOOL_API_URL}/api/v1/fees/recommended`)
            .then((response) => response.json())
            .then((data) => data[config.FEE_LEVEL]),
        tapTweakHash: (pubKey, h) => {
            return bitcoin.crypto.taggedHash('TapTweak', Buffer.concat(h ? [pubKey, h] : [pubKey]));
        },
        /* eslint-disable */
        tweakSigner: (signer) => {
            function _interopNamespace(e) {
                const n = Object.create(null);
                if (e && e.__esModule)
                    return e;
                if (e) {
                    Object.keys(e).forEach(function (k) {
                        if (k !== 'default') {
                            const d = Object.getOwnPropertyDescriptor(e, k);
                            Object.defineProperty(n, k, d?.get
                                ? d
                                : {
                                    enumerable: true,
                                    get: function () {
                                        return e[k];
                                    },
                                });
                        }
                    });
                }
                n['default'] = e;
                return Object.freeze(n);
            }
            var ecc__namespace = /*#__PURE__*/ _interopNamespace(ecc);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            let privateKey = signer.privateKey;
            if (!signer.privateKey) {
                throw new Error('Private key is required for tweaking signer!');
            }
            if (signer.publicKey[0] === 3) {
                privateKey = ecc__namespace.privateNegate(privateKey);
            }
            const tweakedPrivateKey = ecc__namespace.privateAdd(privateKey, 
            // @ts-ignore
            cryptoModule.tapTweakHash(cryptoModule.toXOnly(signer.publicKey), bitcoin.networks.bitcoin.tweakHash));
            if (!tweakedPrivateKey) {
                throw new Error('Invalid tweaked private key!');
            }
            return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
                network: bitcoin.networks.bitcoin,
            });
        },
        /* eslint-enable */
        // Outpoints are reversed-txid followed by a 4-byte LITTLE-endian vout
        // (e.g. vout 160 is encoded "a0000000"); both parts need byte-reversal
        parseOutpoint: (outpoint) => {
            const rawVout = outpoint.slice(-8);
            const txid = outpoint
                .substring(0, outpoint.length - 8)
                .match(/[a-fA-F0-9]{2}/g)
                .reverse()
                .join('');
            const vout = parseInt(rawVout.match(/[a-fA-F0-9]{2}/g).reverse().join(''), 16);
            return [txid, vout];
        },
        sortUtxos: (utxos) => {
            const sortedData = utxos.sort((a, b) => b.status.block_time - a.status.block_time);
            return sortedData.map((utxo) => ({ ...utxo, key: `${utxo.txid}:${utxo.vout}` }));
        },
        getTxHexById: async (txId) => {
            return fetch(`${config.MEMPOOL_API_URL}/api/tx/${txId}/hex`).then((response) => response.text());
        },
    };
    return cryptoModule;
};
// Export the module
export { Crypto };
